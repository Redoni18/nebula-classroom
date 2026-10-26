// The site's three languages and how their addresses are built.
// Albanian is the default and has no prefix ("/", "/privacy"); Macedonian and
// English live under "/mk" and "/en" (next.config.ts does the rewriting).

import { SITE_URL } from "@/lib/site";

export const locales = ["sq", "mk", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "sq";

export const localeInfo: Record<Locale, {
  /** The switcher's label */
  label: string;
  /** The language's own name, for screen readers and the footer */
  name: string;
  /** Locale for dates and numbers (Intl) */
  intl: string;
  /** Open Graph locale */
  og: string;
}> = {
  sq: { label: "SQ", name: "Shqip", intl: "sq", og: "sq_MK" },
  mk: { label: "MK", name: "Македонски", intl: "mk", og: "mk_MK" },
  en: { label: "EN", name: "English", intl: "en-GB", og: "en_GB" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** The address of `path` ("/" or "/privacy") in `locale`: "/privacy", "/mk/privacy", "/en". */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path;
  if (locale === defaultLocale) return clean || "/";
  return `/${locale}${clean}`;
}

export function absoluteUrl(locale: Locale, path = "/"): string {
  const local = localePath(locale, path);
  return local === "/" ? `${SITE_URL}/` : `${SITE_URL}${local}`;
}

/** hreflang alternates for one page, for <head> and the sitemap. */
export function languageAlternates(path = "/"): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, path)])),
    "x-default": absoluteUrl(defaultLocale, path),
  };
}
