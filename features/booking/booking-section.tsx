// "Ways to book": the home page section holding the plans and the booking
// calendar. The headline is rendered here on the server; everything that
// reacts to taps is in components/booking-planner.tsx.

import { SectionHeading } from "@/components/site/heading";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { BookingPlanner } from "./components/booking-planner";

export function BookingSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section aria-labelledby="book-title" className="bg-cream bg-grid py-20 md:py-28">
      {/* The anchor is the content, not the section: "#book" lands on the headline. */}
      <div id="book" className="wrap grid items-start gap-10 lg:grid-cols-2 lg:gap-10 xl:gap-14">
        <BookingPlanner
          locale={locale}
          heading={<SectionHeading id="book-title" parts={dict.plans.title} />}
          plansLabels={dict.plans}
          labels={dict.booking}
          privacyHref={localePath(locale, "/privacy")}
        />
      </div>
    </section>
  );
}
