// The home page ("/", "/mk", "/en"): the whole design, top to bottom.
// Sections live in features/home and features/booking.

import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { BookingSection } from "@/features/booking/booking-section";
import { Hero } from "@/features/home/hero";
import { Included } from "@/features/home/included";
import { Location } from "@/features/home/location";
import { Teach } from "@/features/home/teach";
import { JsonLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { homeGraph } from "@/features/seo/structured-data";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/", title: dict.meta.title, description: dict.meta.description, ogAlt: dict.meta.ogAlt });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  return (
    <PageShell locale={locale} path="/">
      <JsonLd data={homeGraph(locale, dict)} />
      <Hero dict={dict} homeHref={localePath(locale)} />
      <Teach dict={dict} />
      <BookingSection locale={locale} dict={dict} />
      <Included dict={dict} />
      <Location locale={locale} dict={dict} />
    </PageShell>
  );
}
