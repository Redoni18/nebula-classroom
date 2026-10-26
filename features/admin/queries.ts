// What the admin pages read from D1: the bookings list (by view or search),
// the headline numbers, the week grid and the closed days. Server only; the
// pages call requireAdmin() before any of these.

import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { bookingSessions, bookings, closedDays, heldHours } from "@/lib/db/schema";
import { addDays, weekday, type DayKey } from "@/features/booking/model/dates";
import { HOURS } from "@/features/booking/model/rules";

export const bookingViews = ["pending", "upcoming", "all", "archived"] as const;
export type BookingView = (typeof bookingViews)[number];

/** One booking as the admin table and detail panel show it (plain data, passed to the browser). */
export interface BookingRow {
  id: string;
  code: string;
  plan: "day" | "week" | "month" | "exclusive";
  status: "pending" | "confirmed" | "declined" | "cancelled";
  name: string;
  phone: string;
  email: string | null;
  activity: "language" | "tutoring" | "workshop" | "online" | "other";
  groupSize: number | null;
  message: string | null;
  adminNote: string | null;
  locale: "sq" | "mk" | "en";
  source: "web" | "admin";
  totalHours: number;
  firstDate: string;
  lastDate: string;
  createdAt: number;
  archived: boolean;
  sessions: { date: string; start: number; end: number }[];
}

function viewFilter(view: BookingView, today: DayKey) {
  switch (view) {
    case "pending":
      return and(eq(bookings.status, "pending"), isNull(bookings.archivedAt));
    case "upcoming":
      return and(eq(bookings.status, "confirmed"), gte(bookings.lastDate, today), isNull(bookings.archivedAt));
    case "all":
      return isNull(bookings.archivedAt);
    case "archived":
      return isNotNull(bookings.archivedAt);
  }
}

/** A search looks at every booking, archived too: by code, name or phone digits. */
function searchFilter(q: string) {
  const term = q.trim();
  const digits = term.replace(/\D/g, "");
  const conditions = [like(bookings.code, `%${term.toUpperCase()}%`), like(bookings.name, `%${term}%`)];
  // "075 281 813" and "+38975281813" both find a booking stored as +38975281813.
  if (digits.length >= 3) conditions.push(like(bookings.phone, `%${digits.replace(/^0/, "")}%`));
  return or(...conditions);
}

export async function listBookings(db: Db, view: BookingView, q: string, today: DayKey): Promise<BookingRow[]> {
  const where = q.trim() ? searchFilter(q) : viewFilter(view, today);
  const order =
    q.trim() || view === "all" || view === "archived" ? [desc(bookings.createdAt)] : [asc(bookings.firstDate), asc(bookings.createdAt)];
  const rows = await db.select().from(bookings).where(where).orderBy(...order).limit(300);
  if (rows.length === 0) return [];

  const sessions = await db
    .select()
    .from(bookingSessions)
    .where(inArray(bookingSessions.bookingId, rows.map((r) => r.id)))
    .orderBy(asc(bookingSessions.date), asc(bookingSessions.startHour));
  const byBooking = new Map<string, BookingRow["sessions"]>();
  for (const s of sessions) {
    const list = byBooking.get(s.bookingId) ?? [];
    list.push({ date: s.date, start: s.startHour, end: s.endHour });
    byBooking.set(s.bookingId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    plan: r.plan,
    status: r.status,
    name: r.name,
    phone: r.phone,
    email: r.email,
    activity: r.activity,
    groupSize: r.groupSize,
    message: r.message,
    adminNote: r.adminNote,
    locale: r.locale,
    source: r.source,
    totalHours: r.totalHours,
    firstDate: r.firstDate,
    lastDate: r.lastDate,
    createdAt: r.createdAt,
    archived: r.archivedAt !== null,
    sessions: byBooking.get(r.id) ?? [],
  }));
}

export async function viewCounts(db: Db, today: DayKey): Promise<Record<BookingView, number>> {
  const counts = await Promise.all(
    bookingViews.map((view) => db.select({ n: count() }).from(bookings).where(viewFilter(view, today))),
  );
  return Object.fromEntries(bookingViews.map((view, i) => [view, counts[i][0].n])) as Record<BookingView, number>;
}

export async function pendingCount(db: Db): Promise<number> {
  const [row] = await db.select({ n: count() }).from(bookings).where(and(eq(bookings.status, "pending"), isNull(bookings.archivedAt)));
  return row.n;
}

/** The four headline numbers on the bookings page. */
export async function bookingStats(db: Db, today: DayKey, now: number) {
  const monday = addDays(today, -weekday(today));
  const sunday = addDays(monday, 6);
  const [pending, todayHours, weekHours, fresh, closedThisWeek] = await Promise.all([
    pendingCount(db),
    db.select({ n: count() }).from(heldHours).where(eq(heldHours.date, today)),
    db.select({ n: count() }).from(heldHours).where(and(gte(heldHours.date, monday), sql`${heldHours.date} <= ${sunday}`)),
    db
      .select({ n: count() })
      .from(bookings)
      .where(and(eq(bookings.source, "web"), gte(bookings.createdAt, now - 7 * 24 * 60 * 60 * 1000))),
    db.select({ n: count() }).from(closedDays).where(and(gte(closedDays.date, monday), sql`${closedDays.date} <= ${sunday}`)),
  ]);
  const openWeekHours = (7 - closedThisWeek[0].n) * HOURS.length;
  return {
    pending,
    todayHours: todayHours[0].n,
    openToday: HOURS.length,
    weekHours: weekHours[0].n,
    openWeekHours,
    weekPercent: openWeekHours ? Math.round((weekHours[0].n / openWeekHours) * 100) : 0,
    fresh: fresh[0].n,
  };
}

export interface WeekCell {
  bookingId: string;
  code: string;
  name: string;
  status: "pending" | "confirmed";
}

/** Who holds each hour of the 7 days from `monday`, and which of those days are closed. */
export async function weekGrid(db: Db, monday: DayKey) {
  const sunday = addDays(monday, 6);
  const [held, closed] = await Promise.all([
    db
      .select({ date: heldHours.date, hour: heldHours.hour, bookingId: bookings.id, code: bookings.code, name: bookings.name, status: bookings.status })
      .from(heldHours)
      .innerJoin(bookings, eq(bookings.id, heldHours.bookingId))
      .where(and(gte(heldHours.date, monday), sql`${heldHours.date} <= ${sunday}`)),
    db.select().from(closedDays).where(and(gte(closedDays.date, monday), sql`${closedDays.date} <= ${sunday}`)),
  ]);
  const cells: Record<string, WeekCell> = {};
  for (const h of held) {
    cells[`${h.date}:${h.hour}`] = { bookingId: h.bookingId, code: h.code, name: h.name, status: h.status === "confirmed" ? "confirmed" : "pending" };
  }
  return {
    days: Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    cells,
    closed: Object.fromEntries(closed.map((c) => [c.date, c.reason])) as Record<string, string | null>,
  };
}

export async function listClosedDays(db: Db, today: DayKey) {
  return db.select().from(closedDays).where(gte(closedDays.date, today)).orderBy(asc(closedDays.date));
}
