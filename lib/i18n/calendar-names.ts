// Month and weekday names in each language, and the plural rule for "hours".
// Written out here because browsers don't all carry Albanian and Macedonian
// date names (Chrome falls back to English), so Intl can't be trusted for them.
// Weekdays start on Monday.

import type { Locale } from "./locales";

export interface CalendarNames {
  months: string[];
  monthsShort: string[];
  weekdays: string[];
  weekdaysShort: string[];
  weekdaysNarrow: string[];
}

export const calendarNames: Record<Locale, CalendarNames> = {
  sq: {
    months: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"],
    monthsShort: ["jan", "shk", "mar", "pri", "maj", "qer", "korr", "gush", "sht", "tet", "nën", "dhj"],
    weekdays: ["e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë", "e diel"],
    weekdaysShort: ["hën", "mar", "mër", "enj", "pre", "sht", "die"],
    weekdaysNarrow: ["H", "M", "M", "E", "P", "Sh", "D"],
  },
  mk: {
    months: ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"],
    monthsShort: ["јан", "фев", "мар", "апр", "мај", "јун", "јул", "авг", "сеп", "окт", "ное", "дек"],
    weekdays: ["понеделник", "вторник", "среда", "четврток", "петок", "сабота", "недела"],
    weekdaysShort: ["пон", "вто", "сре", "чет", "пет", "саб", "нед"],
    weekdaysNarrow: ["П", "В", "С", "Ч", "П", "С", "Н"],
  },
  en: {
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    weekdaysNarrow: ["M", "T", "W", "T", "F", "S", "S"],
  },
};

/** "one" or "other", by each language's rule (Macedonian: 1, 21, 31… are "one", 11 isn't). */
export function pluralCategory(locale: Locale, n: number): "one" | "other" {
  if (locale === "mk") return n % 10 === 1 && n % 100 !== 11 ? "one" : "other";
  return n === 1 ? "one" : "other";
}
