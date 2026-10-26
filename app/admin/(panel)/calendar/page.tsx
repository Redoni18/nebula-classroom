// /admin/calendar?week=YYYY-MM-DD: the room's week, hour by hour (features/admin/calendar).

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { currentTime } from "@/lib/clock";
import { getDb } from "@/lib/db";
import { isDayKey, tetovoClock } from "@/features/booking/model/dates";
import { mondayOf, WeekView } from "@/features/admin/calendar/week-view";
import { copy } from "@/features/admin/copy";

export const metadata: Metadata = { title: copy.nav.calendar };

export default async function AdminCalendar({ searchParams }: PageProps<"/admin/calendar">) {
  await requireAdmin();
  const { week } = await searchParams;
  const today = tetovoClock(currentTime()).date;
  const monday = mondayOf(typeof week === "string" && isDayKey(week) ? week : today);
  return <WeekView db={getDb()} monday={monday} today={today} />;
}
