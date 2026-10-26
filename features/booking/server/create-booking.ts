// Saves a booking request (SPEC §4): checks the plan's rules again, the rate
// limit and the free hours, then writes the booking, its sessions and one
// held_hours row per hour in a single D1 batch. A batch is a transaction, so
// if someone else took one of the hours a moment earlier, the held_hours key
// rejects it and nothing of this request is saved.

import { and, count, eq, gt } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { Db } from "@/lib/db";
import { bookingSessions, bookings, heldHours } from "@/lib/db/schema";
import type { ParsedBookingRequest } from "../model/request";
import {
  bookingWindow,
  checkPlan,
  expandSessions,
  findConflicts,
  sessionHours,
  totalHours,
  type PlanProblem,
  type Session,
} from "../model/rules";
import { getTakenHours } from "./availability";

/** Requests from one connection in an hour before it has to call instead. */
const REQUESTS_PER_HOUR = 5;
/** D1 allows 100 values per statement: rows per insert, by column count. */
const SESSION_ROWS_PER_INSERT = 20;
const HOUR_ROWS_PER_INSERT = 30;
/** No 0/O, 1/I/L, 2/Z, 5/S, 8/B: easy to read out on the phone. */
const CODE_LETTERS = "ACDEFGHJKMNPQRTUVWXY34679";

export type CreateResult =
  | { kind: "created"; code: string; sessions: Session[] }
  | { kind: "invalid"; problem: PlanProblem }
  | { kind: "conflict"; conflicts: { date: string; hours: number[] }[] }
  | { kind: "tooMany" };

export async function createBooking(
  db: Db,
  request: ParsedBookingRequest,
  { ipHash, now }: { ipHash: string | null; now: number },
): Promise<CreateResult> {
  const window = bookingWindow(now);
  const problem = checkPlan(request.plan, request.sessions, request.startDate, window);
  if (problem) return { kind: "invalid", problem };

  if (ipHash) {
    const [recent] = await db
      .select({ n: count() })
      .from(bookings)
      .where(and(eq(bookings.ipHash, ipHash), gt(bookings.createdAt, now - 60 * 60 * 1000)));
    if (recent.n >= REQUESTS_PER_HOUR) return { kind: "tooMany" };
  }

  const sessions = expandSessions(request.plan, request.sessions, request.startDate);
  const firstDate = sessions[0].date;
  const lastDate = sessions[sessions.length - 1].date;

  // The friendly check: tells the visitor which hours went. The key below is the real guard.
  const conflicts = findConflicts(sessions, await getTakenHours(db, firstDate, lastDate));
  if (conflicts.length > 0) return { kind: "conflict", conflicts };

  const id = crypto.randomUUID();
  const code = makeCode();
  const statements: BatchItem<"sqlite">[] = [
    db.insert(bookings).values({
      id,
      code,
      plan: request.plan,
      name: request.name,
      phone: request.phone,
      email: request.email ?? null,
      activity: request.activity,
      groupSize: request.groupSize ?? null,
      message: request.message ?? null,
      locale: request.locale,
      source: "web",
      totalHours: totalHours(sessions),
      firstDate,
      lastDate,
      ipHash,
      createdAt: now,
      updatedAt: now,
    }),
  ];
  for (const rows of chunk(sessions, SESSION_ROWS_PER_INSERT)) {
    statements.push(
      db.insert(bookingSessions).values(rows.map((s) => ({ bookingId: id, date: s.date, startHour: s.start, endHour: s.end }))),
    );
  }
  const hours = sessions.flatMap((s) => sessionHours(s).map((hour) => ({ date: s.date, hour, bookingId: id })));
  for (const rows of chunk(hours, HOUR_ROWS_PER_INSERT)) {
    statements.push(db.insert(heldHours).values(rows));
  }

  try {
    await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // Someone took an hour between our check and the insert (or, once in a
    // blue moon, the code was already used): report what's taken now.
    const current = findConflicts(sessions, await getTakenHours(db, firstDate, lastDate));
    if (current.length > 0) return { kind: "conflict", conflicts: current };
    throw error;
  }
  return { kind: "created", code, sessions };
}

function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_LETTERS[b % CODE_LETTERS.length]).join("");
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function isUniqueViolation(error: unknown): boolean {
  let e: unknown = error;
  while (e) {
    if (e instanceof Error && /UNIQUE constraint failed/i.test(e.message)) return true;
    e = e instanceof Error ? e.cause : undefined;
  }
  return false;
}
