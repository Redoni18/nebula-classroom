// The two helpers that fill in dictionary text, safe to use in the browser
// (they don't pull the dictionaries into the bundle):
// fill("Call {phone}", { phone }) and plural(locale, 3, { one, other }).

import { pluralCategory } from "./calendar-names";
import type { Locale } from "./locales";

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export function plural(locale: Locale, n: number, forms: { one: string; other: string }): string {
  return fill(pluralCategory(locale, n) === "one" ? forms.one : forms.other, { n });
}
