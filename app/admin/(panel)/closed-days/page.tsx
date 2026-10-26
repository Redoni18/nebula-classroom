// /admin/closed-days: holidays and other days the room is closed (features/admin/closed-days).

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { currentTime } from "@/lib/clock";
import { getDb } from "@/lib/db";
import { tetovoClock } from "@/features/booking/model/dates";
import { ClosedDaysEditor } from "@/features/admin/closed-days/closed-days-editor";
import { copy } from "@/features/admin/copy";
import { listClosedDays } from "@/features/admin/queries";
import { TopBar } from "@/features/admin/shell/top-bar";

export const metadata: Metadata = { title: copy.closedDays.title };

export default async function AdminClosedDays() {
  await requireAdmin();
  const today = tetovoClock(currentTime()).date;
  const days = await listClosedDays(getDb(), today);
  return (
    <>
      <TopBar title={copy.closedDays.title} />
      <div className="flex max-w-4xl flex-col gap-4 p-3 md:p-5">
        <p className="text-sm text-muted-ink">{copy.closedDays.intro}</p>
        <ClosedDaysEditor days={days.map((d) => ({ date: d.date, reason: d.reason }))} today={today} />
      </div>
    </>
  );
}
