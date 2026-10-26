// What the admin does to bookings (SPEC step 2), with the same guarantees as
// a visitor's request (create-booking.ts): every change to the hours a
// booking holds runs in one D1 batch, so the held_hours key still makes double
// booking impossible.
//
// Statuses: pending and confirmed hold their hours; declined and cancelled
// free them. Moving a booking back to pending or confirmed takes the hours
// again, and fails if someone else has them by then.

import { and, eq, inArray, ne } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { Db } from "@/lib/db";
import { bookingSessions, bookings, closedDays, heldHours, type Booking } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/locales";
import { isDayKey } from "../model/dates";
import { CLOSE_HOUR, OPEN_HOUR, sessionHours, totalHours, type Activity, type Plan, type Session } from "../model/rules";

export type BookingStatus = Booking["status"];

const HOLDING: BookingStatus[] = ["pending", "confirmed"];
const SESSION_ROWS_PER_INSERT = 20;
const HOUR_ROWS_PER_INSERT = 30;
const CODE_LETTERS = "ACDEFGHJKMNPQRTUVWXY34679";

export interface AdminBookingInput {
  plan: Plan;
  status: "pending" | "confirmed";
  name: string;
  phone: string;
  email: string | null;
  activity: Activity;
  groupSize: number | null;
  message: string | null;
  adminNote: string | null;
  locale: Locale;
  /** Every block, already written out (no repeating: the admin enters what's booked). */
  sessions: Session[];
}

export type SaveResult =
  | { kind: "saved"; id: string; code: string }
  | { kind: "invalid"; reason: "sessions" | "overlap" }
  | { kind: "closed"; dates: string[] }
  | { kind: "conflict"; conflicts: { date: string; hours: number[]; code: string }[] }
  | { kind: "missing" };

/** Blocks must be real days, inside opening hours, and not overlap each other. */
function checkSessions(sessions: Session[]): "sessions" | "overlap" | null {
  if (sessions.length === 0 || sessions.length > 62) return "sessions";
  const seen = new Set<string>();
  for (const s of sessions) {
    if (!isDayKey(s.date) || !Number.isInteger(s.start) || !Number.isInteger(s.end) || s.start < OPEN_HOUR || s.end > CLOSE_HOUR || s.start >= s.end) {
      return "sessions";
    }
    for (const h of sessionHours(s)) {
      const key = `${s.date}:${h}`;
      if (seen.has(key)) return "overlap";
      seen.add(key);
    }
  }
  return null;
}

/** Hours of `sessions` already held by other bookings, with their codes. */
async function conflictsWith(db: Db, sessions: Session[], ownId: string | null) {
  const dates = [...new Set(sessions.map((s) => s.date))];
  const rows = await db
    .select({ date: heldHours.date, hour: heldHours.hour, code: bookings.code })
    .from(heldHours)
    .innerJoin(bookings, eq(bookings.id, heldHours.bookingId))
    .where(ownId ? and(inArray(heldHours.date, dates), ne(heldHours.bookingId, ownId)) : inArray(heldHours.date, dates));
  const wanted = new Set(sessions.flatMap((s) => sessionHours(s).map((h) => `${s.date}:${h}`)));
  const byDay = new Map<string, { date: string; hours: number[]; code: string }>();
  for (const row of rows) {
    if (!wanted.has(`${row.date}:${row.hour}`)) continue;
    const key = `${row.date}:${row.code}`;
    const entry = byDay.get(key) ?? { date: row.date, hours: [], code: row.code };
    entry.hours.push(row.hour);
    byDay.set(key, entry);
  }
  return [...byDay.values()].map((c) => ({ ...c, hours: c.hours.sort((a, b) => a - b) }));
}

async function closedAmong(db: Db, sessions: Session[]): Promise<string[]> {
  const dates = [...new Set(sessions.map((s) => s.date))];
  const rows = await db.select({ date: closedDays.date }).from(closedDays).where(inArray(closedDays.date, dates));
  return rows.map((r) => r.date).sort();
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function sessionInserts(db: Db, bookingId: string, sessions: Session[]) {
  return chunk(sessions, SESSION_ROWS_PER_INSERT).map((rows) =>
    db.insert(bookingSessions).values(rows.map((s) => ({ bookingId, date: s.date, startHour: s.start, endHour: s.end }))),
  );
}

function holdInserts(db: Db, bookingId: string, sessions: Session[]) {
  const hours = sessions.flatMap((s) => sessionHours(s).map((hour) => ({ date: s.date, hour, bookingId })));
  return chunk(hours, HOUR_ROWS_PER_INSERT).map((rows) => db.insert(heldHours).values(rows));
}

function isUniqueViolation(error: unknown): boolean {
  let e: unknown = error;
  while (e) {
    if (e instanceof Error && /UNIQUE constraint failed/i.test(e.message)) return true;
    e = e instanceof Error ? e.cause : undefined;
  }
  return false;
}

async function runBatch(db: Db, statements: BatchItem<"sqlite">[]) {
  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
}

function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_LETTERS[b % CODE_LETTERS.length]).join("");
}

/** Creates a booking entered by the admin (`id` null) or replaces one's details and hours. */
export async function saveAdminBooking(db: Db, input: AdminBookingInput, id: string | null, now: number): Promise<SaveResult> {
  const sessions = [...input.sessions].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const problem = checkSessions(sessions);
  if (problem) return { kind: "invalid", reason: problem };

  const existing = id ? (await db.select().from(bookings).where(eq(bookings.id, id)))[0] : null;
  if (id && !existing) return { kind: "missing" };

  const closed = await closedAmong(db, sessions);
  if (closed.length) return { kind: "closed", dates: closed };
  const conflicts = await conflictsWith(db, sessions, id);
  if (conflicts.length) return { kind: "conflict", conflicts };

  const fields = {
    plan: input.plan,
    status: input.status,
    name: input.name,
    phone: input.phone,
    email: input.email,
    activity: input.activity,
    groupSize: input.groupSize,
    message: input.message,
    adminNote: input.adminNote,
    locale: input.locale,
    totalHours: totalHours(sessions),
    firstDate: sessions[0].date,
    lastDate: sessions[sessions.length - 1].date,
    updatedAt: now,
  };

  const bookingId = id ?? crypto.randomUUID();
  const code = existing?.code ?? makeCode();
  const statements: BatchItem<"sqlite">[] = existing
    ? [
        db
          .update(bookings)
          .set({ ...fields, decidedAt: existing.status === input.status ? existing.decidedAt : input.status === "confirmed" ? now : existing.decidedAt })
          .where(eq(bookings.id, bookingId)),
        db.delete(heldHours).where(eq(heldHours.bookingId, bookingId)),
        db.delete(bookingSessions).where(eq(bookingSessions.bookingId, bookingId)),
      ]
    : [db.insert(bookings).values({ ...fields, id: bookingId, code, source: "admin", createdAt: now, decidedAt: input.status === "confirmed" ? now : null })];
  statements.push(...sessionInserts(db, bookingId, sessions), ...holdInserts(db, bookingId, sessions));

  try {
    await runBatch(db, statements);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const current = await conflictsWith(db, sessions, id);
    if (current.length) return { kind: "conflict", conflicts: current };
    throw error;
  }
  return { kind: "saved", id: bookingId, code };
}

/** Confirms, declines, cancels or reopens a booking, freeing or taking its hours. */
export async function setBookingStatus(db: Db, id: string, status: BookingStatus, now: number): Promise<SaveResult> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return { kind: "missing" };
  const wasHolding = HOLDING.includes(booking.status);
  const willHold = HOLDING.includes(status);
  const update = db
    .update(bookings)
    .set({ status, updatedAt: now, decidedAt: status === "pending" ? null : status === booking.status ? booking.decidedAt : now })
    .where(eq(bookings.id, id));

  if (wasHolding === willHold) {
    await update;
    return { kind: "saved", id, code: booking.code };
  }
  if (!willHold) {
    await runBatch(db, [update, db.delete(heldHours).where(eq(heldHours.bookingId, id))]);
    return { kind: "saved", id, code: booking.code };
  }

  // Reopening: take the hours again, if they're still free.
  const rows = await db.select().from(bookingSessions).where(eq(bookingSessions.bookingId, id));
  const sessions = rows.map((r) => ({ date: r.date, start: r.startHour, end: r.endHour }));
  const closed = await closedAmong(db, sessions);
  if (closed.length) return { kind: "closed", dates: closed };
  const conflicts = await conflictsWith(db, sessions, id);
  if (conflicts.length) return { kind: "conflict", conflicts };
  try {
    await runBatch(db, [update, ...holdInserts(db, id, sessions)]);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return { kind: "conflict", conflicts: await conflictsWith(db, sessions, id) };
  }
  return { kind: "saved", id, code: booking.code };
}

/** Archived bookings leave the lists; their hours stay as they are. */
export async function setArchived(db: Db, id: string, archived: boolean, now: number) {
  await db.update(bookings).set({ archivedAt: archived ? now : null, updatedAt: now }).where(eq(bookings.id, id));
}

/** Deletes the booking, its sessions and its held hours (cascade). */
export async function deleteBooking(db: Db, id: string) {
  await db.delete(bookings).where(eq(bookings.id, id));
}
