// "Everything included": what comes with the room, as a row of white pills.

import { SectionHeading } from "@/components/site/heading";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function Included({ dict }: { dict: Dictionary }) {
  return (
    <section aria-labelledby="included-title" className="bg-cream bg-grid pb-24 md:pb-32">
      <div className="wrap">
        <SectionHeading id="included-title" parts={dict.included.title} />
        <ul className="mt-8 flex flex-wrap gap-2.5 md:mt-10 md:gap-3">
          {dict.included.items.map((item) => (
            <li key={item} className="rounded-full bg-paper px-5 py-3 text-base font-extrabold md:px-6 md:py-3.5 md:text-lg xl:text-xl">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
