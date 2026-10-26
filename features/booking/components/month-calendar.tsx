"use client";

// The month grid of the booking card (design: "Schedule booking"). Each day
// shows its state: free (cream), some hours taken (outlined), fully booked
// (ink), picked (lime), and, for month and exclusive plans, the days the pick
// repeats on (pale lime). Days before the earliest bookable hour or past the
// last bookable day are dimmed and can't be tapped.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { addMonths, monthGrid, monthOf, type DayKey } from "../model/dates";
import type { Format } from "../model/format";
import { HOURS, isBookable, type BookingWindow, type TakenHours } from "../model/rules";

export type DayState = "free" | "partly" | "full" | "unavailable";

export function dayState(date: DayKey, window: BookingWindow, taken: TakenHours): DayState {
  const bookable = HOURS.filter((h) => isBookable(date, h, window));
  if (bookable.length === 0) return "unavailable";
  const takenHere = bookable.filter((h) => taken[date]?.includes(h));
  if (takenHere.length === bookable.length) return "full";
  return takenHere.length > 0 ? "partly" : "free";
}

export function MonthNav({
  month,
  window,
  fmt,
  labels,
  onMonth,
}: {
  month: DayKey;
  window: BookingWindow;
  fmt: Format;
  labels: Dictionary["booking"];
  onMonth: (month: DayKey) => void;
}) {
  const canBack = month > monthOf(window.earliest.date);
  const canForward = month < monthOf(window.lastDate);
  return (
    <div className="flex items-center gap-1 text-[0.95rem] font-bold">
      <button type="button" disabled={!canBack} onClick={() => onMonth(addMonths(month, -1))} aria-label={labels.prevMonth} className="grid size-8 place-items-center rounded-full hover:bg-cream disabled:opacity-25">
        <ChevronLeft className="size-4" strokeWidth={3} />
      </button>
      <span aria-live="polite" className="min-w-[8.5rem] text-center">
        {fmt.month(month)}
      </span>
      <button type="button" disabled={!canForward} onClick={() => onMonth(addMonths(month, 1))} aria-label={labels.nextMonth} className="grid size-8 place-items-center rounded-full hover:bg-cream disabled:opacity-25">
        <ChevronRight className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
}

export function MonthCalendar({
  month,
  window,
  taken,
  chosen,
  echoes,
  conflicts,
  activeDate,
  fmt,
  labels,
  onDay,
}: {
  month: DayKey;
  window: BookingWindow;
  taken: TakenHours;
  /** Days the visitor picked. */
  chosen: Set<DayKey>;
  /** Days the pick repeats on (month plan) or covers (exclusive month). */
  echoes: Set<DayKey>;
  /** Echo days where some of those hours are taken. */
  conflicts: Set<DayKey>;
  activeDate: DayKey | null;
  fmt: Format;
  labels: Dictionary["booking"];
  onDay: (date: DayKey) => void;
}) {
  const days = monthGrid(month);
  const monthPrefix = month.slice(0, 7);

  return (
    <div className="mt-5">
      <div aria-hidden className="grid grid-cols-7 gap-1.5 pb-2 text-center text-xs font-semibold text-muted-ink md:gap-2.5">
        {fmt.weekdays().map((letter, i) => (
          <span key={i}>{letter}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 md:gap-2.5">
        {days.map((date) => {
          const inMonth = date.startsWith(monthPrefix);
          const dayNumber = Number(date.slice(8));
          if (!inMonth) {
            // The neighbouring months' days are faint decoration, as in the design:
            // drawn by CSS (content), so they aren't read out or checked as text.
            return (
              <span
                key={date}
                aria-hidden
                data-day={dayNumber}
                className="grid h-10 place-items-center text-[0.95rem] font-medium text-muted-ink/45 before:content-[attr(data-day)] md:h-12"
              />
            );
          }
          const state = dayState(date, window, taken);
          const isChosen = chosen.has(date);
          const isEcho = !isChosen && echoes.has(date);
          const disabled = state === "unavailable" || (state === "full" && !isChosen);
          const description = isChosen ? labels.dayStatus.chosen : labels.dayStatus[state];
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onDay(date)}
              aria-pressed={isChosen}
              aria-current={activeDate === date ? "date" : undefined}
              aria-label={`${fmt.full(date)}, ${description}`}
              className={cn(
                "relative grid h-10 place-items-center rounded-[0.7rem] border-2 border-transparent text-[0.95rem] font-semibold transition-colors md:h-12 md:rounded-[0.85rem]",
                state === "free" && "bg-cream hover:bg-lime-soft",
                state === "partly" && "border-ink bg-paper hover:bg-lime-soft",
                state === "full" && "bg-ink text-paper/80 line-through",
                state === "unavailable" && "bg-cream/50 text-muted-ink/50",
                isEcho && "bg-lime-soft",
                isEcho && conflicts.has(date) && "border-dashed border-ink",
                isChosen && "border-ink bg-lime text-ink no-underline hover:bg-lime",
                activeDate === date && "ring-2 ring-ink ring-offset-2",
              )}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLegend({ labels }: { labels: Dictionary["booking"] }) {
  return (
    <ul className="mt-5 flex flex-col gap-1.5 text-[0.82rem] leading-snug md:text-sm">
      <li>
        <span className="mr-1.5 inline-block rounded-md border-2 border-ink px-1.5 font-semibold">{labels.legendPartly}</span>
        {labels.legendPartlyText}
      </li>
      <li>
        <span className="mr-1.5 inline-block rounded-md bg-lime px-1.5 py-px font-semibold">{labels.legendChosen}</span>
        {labels.legendChosenText}
      </li>
      <li>
        <span className="mr-1.5 inline-block rounded-md bg-ink px-1.5 py-px font-semibold text-paper">{labels.legendFull}</span>
        {labels.legendFullText}
      </li>
    </ul>
  );
}
