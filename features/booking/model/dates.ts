// Calendar days as "YYYY-MM-DD" strings, in Tetovo's time zone.
//
// Bookings are about wall-clock hours in the room ("Tuesday 10 Nov, 12:00"),
// so days are plain strings and hours plain numbers: no time zone maths
// except when asking "what day and hour is it in Tetovo right now?".
// Day arithmetic goes through UTC dates, which have no daylight-saving jumps.

export const TIME_ZONE = "Europe/Skopje";

/** A calendar day, "2026-11-10". */
export type DayKey = string;

const DAY_MS = 24 * 60 * 60 * 1000;
const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toKey(year: number, month: number, day: number): DayKey {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isDayKey(value: string): boolean {
  const m = KEY_PATTERN.exec(value);
  if (!m) return false;
  const date = keyToDate(value);
  return date.getUTCFullYear() === Number(m[1]) && date.getUTCMonth() + 1 === Number(m[2]) && date.getUTCDate() === Number(m[3]);
}

/** Midnight UTC of the day: format it with `timeZone: "UTC"` to print the day itself. */
export function keyToDate(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dateToKey(date: Date): DayKey {
  return toKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(key: DayKey, days: number): DayKey {
  return dateToKey(new Date(keyToDate(key).getTime() + days * DAY_MS));
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(key: DayKey): number {
  return (keyToDate(key).getUTCDay() + 6) % 7;
}

/** The first day of the month that `key` falls in. */
export function monthOf(key: DayKey): DayKey {
  return key.slice(0, 8) + "01";
}

export function addMonths(monthKey: DayKey, months: number): DayKey {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return dateToKey(date);
}

/** Six Monday-first weeks covering the month (42 days), as in the design. */
export function monthGrid(monthKey: DayKey): DayKey[] {
  const first = monthOf(monthKey);
  const start = addDays(first, -weekday(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Every day from `from` to `to`, both included. */
export function daysInRange(from: DayKey, to: DayKey): DayKey[] {
  const count = daysBetween(from, to);
  return Array.from({ length: Math.max(0, count + 1) }, (_, i) => addDays(from, i));
}

/** The day and hour in Tetovo at `now` (a timestamp). */
export function tetovoClock(now: number): { date: DayKey; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { date: toKey(get("year"), get("month"), get("day")), hour: get("hour"), minute: get("minute") };
}
