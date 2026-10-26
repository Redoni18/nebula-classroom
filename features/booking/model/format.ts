// How days, hours and phone numbers are written in each language
// ("Tuesday 10 Nov", "E martë, 10 nën", "12:00–14:00", "075 281 813").
// Names come from lib/i18n/calendar-names.ts, not the browser's Intl.

import { calendarNames } from "@/lib/i18n/calendar-names";
import type { Locale } from "@/lib/i18n/locales";
import { weekday, type DayKey } from "./dates";
import type { Session } from "./rules";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function createFormat(locale: Locale) {
  const names = calendarNames[locale];
  const parts = (d: DayKey) => ({ day: Number(d.slice(8)), month: Number(d.slice(5, 7)) - 1, year: d.slice(0, 4), wd: weekday(d) });
  // English writes "Tuesday 10 Nov"; Albanian and Macedonian put a comma after the weekday.
  const sep = locale === "en" ? " " : ", ";

  return {
    /** "Tuesday 10 Nov" */
    long: (d: DayKey) => {
      const p = parts(d);
      return `${capitalize(names.weekdays[p.wd])}${sep}${p.day} ${names.monthsShort[p.month]}`;
    },
    /** "Tue 10 Nov" */
    short: (d: DayKey) => {
      const p = parts(d);
      return `${capitalize(names.weekdaysShort[p.wd])} ${p.day} ${names.monthsShort[p.month]}`;
    },
    /** "10 Nov" */
    dayMonth: (d: DayKey) => {
      const p = parts(d);
      return `${p.day} ${names.monthsShort[p.month]}`;
    },
    /** "Tuesday, 10 November 2026" (screen readers) */
    full: (d: DayKey) => {
      const p = parts(d);
      return `${capitalize(names.weekdays[p.wd])}, ${p.day} ${names.months[p.month]} ${p.year}`;
    },
    /** "November 2026" */
    month: (d: DayKey) => {
      const p = parts(d);
      return `${capitalize(names.months[p.month])} ${p.year}`;
    },
    /** Monday-first weekday letters */
    weekdays: () => names.weekdaysNarrow,
    /** "12:00" */
    hour: (h: number) => `${h}:00`,
    /** "12:00–14:00" */
    range: (s: Pick<Session, "start" | "end">) => `${s.start}:00–${s.end}:00`,
    /** "10 Nov, 17 Nov, 24 Nov" */
    list: (items: string[]) => items.join(", "),
  };
}

export type Format = ReturnType<typeof createFormat>;

/** "+38975281813" → "075 281 813"; other countries stay international. */
export function displayPhone(phone: string): string {
  const local = /^\+389(\d{2})(\d{3})(\d{3})$/.exec(phone);
  return local ? `0${local[1]} ${local[2]} ${local[3]}` : phone;
}
