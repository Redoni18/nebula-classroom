// The booking rules (SPEC §4), shared by the calendar in the browser and the
// server that saves requests: opening hours, notice, how far ahead, each
// plan's shape and minimum, and how a plan's picks become the hours it holds.
// The browser uses them to guide the visitor; the server checks them again.

import { addDays, daysBetween, isDayKey, tetovoClock, type DayKey } from "./dates";

export const OPEN_HOUR = 8;
/** The room closes at 22:00, so the last bookable hour starts at 21:00. */
export const CLOSE_HOUR = 22;
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
/** Bookings start at least this many hours from now. */
export const NOTICE_HOURS = 24;
/** The calendar goes this many days ahead. */
export const HORIZON_DAYS = 183;

export const plans = ["day", "week", "month", "exclusive"] as const;
export type Plan = (typeof plans)[number];

export const activities = ["language", "tutoring", "workshop", "online", "other"] as const;
export type Activity = (typeof activities)[number];

export const planRules = {
  /** One day, one block of hours. */
  day: { minHours: 1, maxDays: 1, spanDays: 1, repeatWeeks: 1 },
  /** Up to 7 days within 7 days of the first. */
  week: { minHours: 4, maxDays: 7, spanDays: 7, repeatWeeks: 1 },
  /** One week's days and hours, repeated for 4 weeks. */
  month: { minHours: 16, maxDays: 7, spanDays: 7, repeatWeeks: 4 },
  /** Every hour of 30 days from the start day. */
  exclusive: { minHours: 0, maxDays: 1, spanDays: 1, repeatWeeks: 1, days: 30 },
} as const;

/** One block of hours on one day; `end` is exclusive (12–14 is two hours). */
export interface Session {
  date: DayKey;
  start: number;
  end: number;
}

/** Hours already held, per day: { "2026-11-10": [18, 19] }. */
export type TakenHours = Record<DayKey, number[]>;

export interface BookingWindow {
  /** The first day and hour that can still be booked. */
  earliest: { date: DayKey; hour: number };
  /** The last day the calendar offers. */
  lastDate: DayKey;
}

export function bookingWindow(now: number): BookingWindow {
  const later = tetovoClock(now + NOTICE_HOURS * 60 * 60 * 1000);
  let { date, hour } = later;
  if (later.minute > 0) hour += 1;
  if (hour >= 24) {
    date = addDays(date, 1);
    hour = 0;
  }
  return { earliest: { date, hour }, lastDate: addDays(tetovoClock(now).date, HORIZON_DAYS) };
}

export function isBookable(date: DayKey, hour: number, window: BookingWindow): boolean {
  if (date > window.lastDate) return false;
  if (date > window.earliest.date) return true;
  return date === window.earliest.date && hour >= window.earliest.hour;
}

export function sessionHours(session: Session): number[] {
  return Array.from({ length: session.end - session.start }, (_, i) => session.start + i);
}

export function totalHours(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + (s.end - s.start), 0);
}

/**
 * The sessions a request holds. Day and week: what was picked. Month: the
 * picked week, 4 times. Exclusive: every open hour of 30 days from `startDate`.
 */
export function expandSessions(plan: Plan, picked: Session[], startDate?: DayKey): Session[] {
  if (plan === "exclusive") {
    if (!startDate) return [];
    return Array.from({ length: planRules.exclusive.days }, (_, i) => ({
      date: addDays(startDate, i),
      start: OPEN_HOUR,
      end: CLOSE_HOUR,
    }));
  }
  const sorted = [...picked].sort((a, b) => a.date.localeCompare(b.date));
  const weeks = planRules[plan].repeatWeeks;
  return Array.from({ length: weeks }, (_, w) => sorted.map((s) => ({ ...s, date: addDays(s.date, w * 7) }))).flat();
}

export type PlanProblem =
  | "empty"
  | "invalid"
  | "tooManyDays"
  | "span"
  | "tooSoon"
  | "tooFar"
  | "tooFewHours";

/** What's wrong with a plan's picks, or null when it can be requested. */
export function checkPlan(plan: Plan, picked: Session[], startDate: DayKey | undefined, window: BookingWindow): PlanProblem | null {
  if (plan === "exclusive") {
    if (!startDate) return "empty";
    if (!isDayKey(startDate)) return "invalid";
    if (startDate > window.lastDate) return "tooFar";
    return isBookable(startDate, OPEN_HOUR, window) ? null : "tooSoon";
  }

  const rules = planRules[plan];
  if (picked.length === 0) return "empty";
  const dates = new Set<string>();
  for (const s of picked) {
    const valid =
      isDayKey(s.date) &&
      Number.isInteger(s.start) &&
      Number.isInteger(s.end) &&
      s.start >= OPEN_HOUR &&
      s.end <= CLOSE_HOUR &&
      s.start < s.end &&
      !dates.has(s.date);
    if (!valid) return "invalid";
    dates.add(s.date);
  }
  if (picked.length > rules.maxDays) return "tooManyDays";
  const sorted = [...dates].sort();
  if (daysBetween(sorted[0], sorted[sorted.length - 1]) >= rules.spanDays) return "span";
  if (sorted[sorted.length - 1] > window.lastDate) return "tooFar";
  if (picked.some((s) => !isBookable(s.date, s.start, window))) return "tooSoon";
  if (totalHours(expandSessions(plan, picked)) < rules.minHours) return "tooFewHours";
  return null;
}

/** The hours of `sessions` that are already held, per day (empty when all are free). */
export function findConflicts(sessions: Session[], taken: TakenHours): { date: DayKey; hours: number[] }[] {
  return sessions
    .map((s) => ({ date: s.date, hours: sessionHours(s).filter((h) => taken[s.date]?.includes(h)) }))
    .filter((c) => c.hours.length > 0);
}
