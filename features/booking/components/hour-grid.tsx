"use client";

// "Pick your hours": one button per opening hour of the chosen day. Taken
// hours are ink and struck through, hours inside the 24-hour notice are dimmed,
// the picked range is lime.

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { DayKey } from "../model/dates";
import type { Format } from "../model/format";
import { HOURS, isBookable, type BookingWindow, type Session, type TakenHours } from "../model/rules";

export function HourGrid({
  date,
  window,
  taken,
  pick,
  anchor,
  fmt,
  labels,
  onHour,
}: {
  date: DayKey;
  window: BookingWindow;
  taken: TakenHours;
  pick: Session | undefined;
  anchor: number | null;
  fmt: Format;
  labels: Dictionary["booking"];
  onHour: (hour: number) => void;
}) {
  return (
    <div role="group" aria-label={`${labels.pickHours}: ${fmt.long(date)}`} className="mt-4 grid grid-cols-4 gap-2 md:gap-2.5">
      {HOURS.map((hour) => {
        const isTaken = taken[date]?.includes(hour) ?? false;
        const tooSoon = !isBookable(date, hour, window);
        const picked = !!pick && hour >= pick.start && hour < pick.end;
        const state = isTaken ? labels.hourTaken : tooSoon ? labels.hourTooSoon : null;
        return (
          <button
            key={hour}
            type="button"
            disabled={isTaken || tooSoon}
            onClick={() => onHour(hour)}
            aria-pressed={picked}
            aria-label={state ? `${fmt.hour(hour)}, ${state}` : fmt.hour(hour)}
            className={cn(
              "h-10 rounded-[0.7rem] border-2 border-transparent text-[0.92rem] font-semibold tabular-nums transition-colors md:h-11",
              !isTaken && !tooSoon && "bg-cream hover:bg-lime-soft",
              isTaken && "bg-ink text-paper/80 line-through",
              tooSoon && !isTaken && "bg-cream/50 text-muted-ink/45",
              picked && "border-ink bg-lime hover:bg-lime",
              anchor === hour && "ring-2 ring-ink ring-offset-2",
            )}
          >
            {fmt.hour(hour)}
          </button>
        );
      })}
    </div>
  );
}
