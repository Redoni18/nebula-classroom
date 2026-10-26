// /sitemap.xml: every public page in every language, each listing its
// language alternates (hreflang), plus the photos on the home page.

import type { MetadataRoute } from "next";
import { absoluteUrl, languageAlternates, locales } from "@/lib/i18n/locales";
import { SITE_URL, site } from "@/lib/site";

const PAGES: { path: string; changeFrequency: "weekly" | "yearly"; priority: number; images?: string[] }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, images: Object.values(site.photos).map((p) => `${SITE_URL}${p.src}`) },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: absoluteUrl(locale, page.path),
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages: languageAlternates(page.path) },
      images: page.images,
    })),
  );
}
