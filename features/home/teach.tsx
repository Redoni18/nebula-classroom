// "What will you teach here?": the black section with the four kinds of
// lessons. Each card's arrow opens the calendar with that lesson chosen in
// the booking form. The card under the pointer (or keyboard focus) turns lime.

import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/site/heading";
import { fill, type Dictionary } from "@/lib/i18n/dictionary";
import { ActivityLink } from "@/features/booking/components/intent-links";

const ORDER = ["language", "tutoring", "workshop", "online"] as const;

export function Teach({ dict }: { dict: Dictionary }) {
  return (
    <section aria-labelledby="teach-title" className="bg-lime bg-grid pt-14 [--grid-line:rgb(11_11_11/0.11)] md:pt-20">
      <div className="rounded-t-[2.5rem] bg-ink bg-grid pb-20 pt-16 text-paper [--grid-line:rgb(255_255_255/0.07)] md:rounded-t-[3.5rem] md:pb-28 md:pt-24">
        <div className="wrap">
          <SectionHeading id="teach-title" parts={dict.teach.title} stacked />
          <ul className="teach-cards mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-6">
            {ORDER.map((key, i) => {
              const item = dict.teach.items[key];
              return (
                <li key={key}>
                  <ActivityLink
                    activity={key}
                    className="teach-card group/card flex h-full min-h-60 flex-col rounded-[1.75rem] p-7 md:min-h-80 md:rounded-[2rem] md:p-8"
                  >
                    <span className="flex items-start justify-between">
                      <span className="text-sm font-bold tracking-[0.2em] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                      <ArrowRight aria-hidden className="size-7 stroke-[1.5] transition-transform group-hover/card:translate-x-1" />
                    </span>
                    <span className="mt-auto pt-10">
                      <span className="block text-[1.75rem] font-extrabold leading-[1.05] tracking-tight md:text-[1.9rem]">{item.title}</span>
                      <span className="mt-3 block text-[0.95rem] leading-snug opacity-85 md:text-base">{item.text}</span>
                      <span className="sr-only">{fill(dict.teach.book, { activity: dict.activityNames[key] })}</span>
                    </span>
                  </ActivityLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
