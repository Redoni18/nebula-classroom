// The admin's week of the room: seven columns (Monday to Sunday), one row per
// opening hour. Each booking is one block over the hours it holds (lime when
// pending, ink when confirmed) linking to it in the bookings list; closed
// days are hatched with their reason.

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { addDays, weekday, type DayKey } from "@/features/booking/model/dates";
import { CLOSE_HOUR, HOURS, OPEN_HOUR } from "@/features/booking/model/rules";
import { copy } from "../copy";
import { fmt } from "../format";
import { weekGrid, type WeekCell } from "../queries";
import { TopBar } from "../shell/top-bar";

interface Block extends WeekCell {
  start: number;
  end: number;
}

/** Consecutive hours held by the same booking become one block. */
function blocksOf(day: DayKey, cells: Record<string, WeekCell>): Block[] {
  const blocks: Block[] = [];
  for (const hour of HOURS) {
    const cell = cells[`${day}:${hour}`];
    if (!cell) continue;
    const last = blocks[blocks.length - 1];
    if (last && last.bookingId === cell.bookingId && last.end === hour) last.end = hour + 1;
    else blocks.push({ ...cell, start: hour, end: hour + 1 });
  }
  return blocks;
}

export function mondayOf(day: DayKey): DayKey {
  return addDays(day, -weekday(day));
}

export async function WeekView({ db, monday, today }: { db: Db; monday: DayKey; today: DayKey }) {
  const { days, cells, closed } = await weekGrid(db, monday);
  const c = copy.calendar;
  const rows = CLOSE_HOUR - OPEN_HOUR;

  return (
    <>
      <TopBar title={c.title}>
        <span className="hidden text-sm font-semibold sm:inline">
          {fmt.dayMonth(days[0])} – {fmt.dayMonth(days[6])} {days[6].slice(0, 4)}
        </span>
        <Button asChild variant="outline" size="icon-sm" aria-label={c.prev}>
          <Link href={`/admin/calendar?week=${addDays(monday, -7)}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/calendar">{c.thisWeek}</Link>
        </Button>
        <Button asChild variant="outline" size="icon-sm" aria-label={c.next}>
          <Link href={`/admin/calendar?week=${addDays(monday, 7)}`}>
            <ChevronRight />
          </Link>
        </Button>
      </TopBar>

      <div className="flex flex-col gap-3 p-3 md:p-5">
        <ul className="flex flex-wrap gap-3 text-xs font-semibold">
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-lime" /> {c.legendPending}</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-ink" /> {c.legendConfirmed}</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[repeating-linear-gradient(45deg,var(--cream-line)_0_3px,transparent_3px_6px)]" /> {c.legendClosed}</li>
        </ul>

        <div className="overflow-x-auto rounded-xl border border-cream-line bg-paper">
          <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(7,1fr)]">
            <div className="border-b border-cream-line" />
            {days.map((day) => (
              <div key={day} className={cn("border-b border-l border-cream-line px-2 py-2 text-sm", day === today && "bg-lime-soft")}>
                <div className="font-bold">{fmt.short(day)}</div>
                {day in closed && <div className="truncate text-xs text-muted-ink">{c.closed}{closed[day] ? ` · ${closed[day]}` : ""}</div>}
              </div>
            ))}

            <div className="grid" style={{ gridTemplateRows: `repeat(${rows}, 2.75rem)` }}>
              {HOURS.map((h) => (
                <div key={h} className="border-b border-cream-line pr-2 pt-1 text-right text-xs tabular-nums text-muted-ink">
                  {fmt.hour(h)}
                </div>
              ))}
            </div>
            {days.map((day) => (
              <div
                key={day}
                className={cn("relative grid border-l border-cream-line", day in closed && "bg-[repeating-linear-gradient(45deg,var(--cream-line)_0_4px,transparent_4px_10px)]")}
                style={{ gridTemplateRows: `repeat(${rows}, 2.75rem)` }}
              >
                {HOURS.map((h) => (
                  <div key={h} className="border-b border-cream-line" style={{ gridRow: h - OPEN_HOUR + 1, gridColumn: 1 }} />
                ))}
                {blocksOf(day, cells).map((block) => (
                  <Link
                    key={`${block.bookingId}-${block.start}`}
                    href={`/admin?q=${block.code}`}
                    className={cn(
                      "z-10 m-0.5 flex flex-col overflow-hidden rounded-md px-1.5 py-1 text-xs leading-tight transition-opacity hover:opacity-85",
                      block.status === "confirmed" ? "bg-ink text-paper" : "bg-lime text-ink",
                    )}
                    style={{ gridRow: `${block.start - OPEN_HOUR + 1} / span ${block.end - block.start}`, gridColumn: 1 }}
                  >
                    <span className="font-mono font-bold">{block.code}</span>
                    <span className="truncate">{block.name}</span>
                    <span className="opacity-70">{fmt.range(block)}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
