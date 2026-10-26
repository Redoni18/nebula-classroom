"use client";

// "Your pick: 12:00–14:00 · 2 hours", the lime bar under the hours. For a
// week or month it lists each day (with a button to remove it) and the total;
// for a month, the dates the week repeats on; for an exclusive month, the 30
// days it covers. Taken hours in the repeats are listed so the visitor can
// change them before sending.

import { X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fill, plural } from "@/lib/i18n/text";
import type { Locale } from "@/lib/i18n/locales";
import type { DayKey } from "../model/dates";
import type { Format } from "../model/format";
import { totalHours, type Plan, type Session } from "../model/rules";

export function PickSummary({
  locale,
  plan,
  picks,
  expanded,
  conflicts,
  fmt,
  labels,
  onRemove,
}: {
  locale: Locale;
  plan: Plan;
  picks: Session[];
  /** The sessions the request will hold (month: 4 weeks; exclusive: 30 days). */
  expanded: Session[];
  conflicts: { date: DayKey; hours: number[] }[];
  fmt: Format;
  labels: Dictionary["booking"];
  onRemove?: (date: DayKey) => void;
}) {
  if (expanded.length === 0) return null;
  const hours = (n: number) => plural(locale, n, labels.hours);
  const conflictList = fmt.list(
    conflicts.map((c) => (plan === "exclusive" ? fmt.dayMonth(c.date) : `${fmt.dayMonth(c.date)} ${fmt.range({ start: c.hours[0], end: c.hours[c.hours.length - 1] + 1 })}`)),
  );

  if (plan === "exclusive") {
    return (
      <div className="mt-5 flex flex-col gap-2">
        <p className="rounded-xl bg-lime px-4 py-3 text-[0.95rem] font-bold leading-snug">
          {fill(labels.exclusiveRange, { from: fmt.dayMonth(expanded[0].date), to: fmt.dayMonth(expanded[expanded.length - 1].date) })}
        </p>
        {conflicts.length > 0 && <p className="rounded-xl border-2 border-ink px-4 py-3 text-sm font-semibold">{fill(labels.exclusiveConflicts, { list: conflictList })}</p>}
      </div>
    );
  }

  if (plan === "day") {
    const pick = picks[0];
    return (
      <p className="mt-5 rounded-xl bg-lime px-4 py-3 text-[0.95rem] font-bold">
        {labels.yourPick}: {fmt.range(pick)} · {hours(pick.end - pick.start)}
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-2">
      <div className="rounded-xl bg-lime px-4 py-3">
        <p className="text-[0.95rem] font-bold">{labels.yourPick}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {picks.map((pick) => (
            <li key={pick.date} className="flex items-center gap-1 rounded-full bg-paper py-1 pl-3 pr-1 text-sm font-semibold">
              {fmt.short(pick.date)}, {fmt.range(pick)}
              {onRemove && (
                <button type="button" onClick={() => onRemove(pick.date)} aria-label={fill(labels.removeDay, { day: fmt.long(pick.date) })} className="grid size-6 place-items-center rounded-full hover:bg-cream">
                  <X className="size-3.5" strokeWidth={3} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {plan === "month" && (
          <p className="mt-2 text-sm font-medium">
            {fill(labels.repeats, { dates: fmt.list(Array.from({ length: 4 }, (_, w) => fmt.dayMonth(expanded[w * picks.length].date))) })}
          </p>
        )}
        <p className="mt-2 text-sm font-bold">{fill(labels.total, { hours: hours(totalHours(expanded)) })}</p>
      </div>
      {conflicts.length > 0 && <p className="rounded-xl border-2 border-ink px-4 py-3 text-sm font-semibold">{fill(labels.conflicts, { list: conflictList })}</p>}
    </div>
  );
}
