// How the admin writes days, times, plans and lessons (in Albanian), shared
// by its server and browser parts. Names come from the site's Albanian copy.

import { sq } from "@/lib/i18n/dictionaries/sq";
import { tetovoClock } from "@/features/booking/model/dates";
import { createFormat } from "@/features/booking/model/format";
import type { BookingRow } from "./queries";

export const fmt = createFormat("sq");

export const planName = (plan: BookingRow["plan"]) => sq.plans.items[plan].name;
export const activityName = (activity: BookingRow["activity"]) => sq.booking.details.activities[activity];

/** "26 tet, 07:05" in Tetovo's time. */
export function formatCreated(ms: number): string {
  const clock = tetovoClock(ms);
  return `${fmt.dayMonth(clock.date)}, ${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`;
}

/** "Mar 10 nën, 12:00–14:00" for one block; "10 nën – 7 dhj" for several days. */
export function formatWhen(row: Pick<BookingRow, "firstDate" | "lastDate" | "sessions">): string {
  if (row.sessions.length === 1) return `${fmt.short(row.firstDate)}, ${fmt.range(row.sessions[0])}`;
  if (row.firstDate === row.lastDate) return fmt.short(row.firstDate);
  return `${fmt.dayMonth(row.firstDate)} – ${fmt.dayMonth(row.lastDate)}`;
}
