// The privacy notice's layout: a lime title band, then the sections from the
// dictionary as full-width rows (heading left, text right). The phone and
// email come from lib/site.ts.

import { Marked } from "@/components/site/heading";
import { fill, type Dictionary } from "@/lib/i18n/dictionary";
import { calendarNames } from "@/lib/i18n/calendar-names";
import type { Locale } from "@/lib/i18n/locales";
import { mainPhone, site } from "@/lib/site";

/** Change when the notice's content changes. */
const UPDATED = "2026-10-26";

export function PrivacyNotice({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const p = dict.privacy;
  const [year, month, day] = UPDATED.split("-").map(Number);
  const updated = `${day} ${calendarNames[locale].months[month - 1]} ${year}`;
  return (
    <>
      <div className="bg-lime bg-grid pb-14 pt-32 [--grid-line:rgb(11_11_11/0.11)] md:pb-20 md:pt-44">
        <div className="wrap">
          <h1 className="font-display text-[clamp(3rem,9vw,6.5rem)]">
            <Marked tone="ink">{p.title}</Marked>
          </h1>
          <p className="mt-6 max-w-xl text-lg md:text-xl">{p.description}</p>
        </div>
      </div>
      {/* No card: each section is a row across the page, heading left and text right, set off by a rule. */}
      <article className="bg-cream bg-grid py-12 md:py-20">
        <div className="wrap">
          {p.sections.map((section) => (
            <section key={section.heading} className="grid gap-3 border-t-2 border-ink py-8 md:grid-cols-[1fr_2fr] md:gap-10 md:py-10">
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{section.heading}</h2>
              <div className="flex flex-col gap-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-lg leading-relaxed text-ink/85 md:text-xl">
                    {fill(paragraph, { phone: mainPhone.display, email: site.email })}
                  </p>
                ))}
              </div>
            </section>
          ))}
          <p className="border-t-2 border-ink pt-6 text-sm text-muted-ink">{fill(p.updated, { date: updated })}</p>
        </div>
      </article>
    </>
  );
}
