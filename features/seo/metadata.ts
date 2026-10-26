// The <head> of every public page (SPEC §5): title, description, canonical
// address, hreflang links to the other languages, and the Open Graph / X card
// with that language's share image (public/og/<locale>.png, made by
// `corepack pnpm images`).

import type { Metadata } from "next";
import { absoluteUrl, languageAlternates, localeInfo, locales, type Locale } from "@/lib/i18n/locales";
import { site } from "@/lib/site";

/**
 * The tab and search-result title. The home page leads with the name
 * ("Nebula Classroom | Sallë mësimi…"), so it shows in a narrow browser tab;
 * other pages put their own short name first ("Privatësia | Nebula Classroom").
 */
export function pageTitle(path: string, title: string): string {
  return path === "/" ? `${site.name} | ${title}` : `${title} | ${site.name}`;
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  ogAlt,
}: {
  locale: Locale;
  /** The page's path without the language: "/" or "/privacy". */
  path: string;
  /** Without the site name: it's added here (see pageTitle). */
  title: string;
  description: string;
  ogAlt: string;
}): Metadata {
  const url = absoluteUrl(locale, path);
  const fullTitle = pageTitle(path, title);
  const image = { url: `/og/${locale}.png`, width: 1200, height: 630, alt: ogAlt, type: "image/png" };
  return {
    // Absolute: the layout's title template doesn't reach the home page (same route segment).
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: fullTitle,
      description,
      url,
      locale: localeInfo[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeInfo[l].og),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}
