// Which hours are already taken, per day: what the public calendar shows and
// what a new request is checked against. Held hours (pending and confirmed
// bookings) plus closed days, which count as every hour taken. No names or
// details leave this function, only days and hours.

import { between } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { closedDays, heldHours } from "@/lib/db/schema";
import type { DayKey } from "../model/dates";
import { HOURS, type TakenHours } from "../model/rules";

export async function getTakenHours(db: Db, from: DayKey, to: DayKey): Promise<TakenHours> {
  const [rows, closed] = await Promise.all([
    db.select({ date: heldHours.date, hour: heldHours.hour }).from(heldHours).where(between(heldHours.date, from, to)),
    db.select({ date: closedDays.date }).from(closedDays).where(between(closedDays.date, from, to)),
  ]);
  const taken: TakenHours = {};
  for (const row of rows) (taken[row.date] ??= []).push(row.hour);
  for (const day of closed) taken[day.date] = [...HOURS];
  for (const hours of Object.values(taken)) hours.sort((a, b) => a - b);
  return taken;
}
