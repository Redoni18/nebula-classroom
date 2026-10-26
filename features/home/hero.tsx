// The top of the home page on lime: "YOUR CLASS. YOUR ROOM.", the call and
// "see free days" buttons, the classroom photo with what's in the room listed
// under it, then the cream strip of four short facts.

import Image from "next/image";
import { AirVent, Tv, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fill, type Dictionary } from "@/lib/i18n/dictionary";
import { mainPhone, site } from "@/lib/site";

/** In the order of dict.hero.features: WiFi, A/C, TV + whiteboard. */
const FEATURE_ICONS = [Wifi, AirVent, Tv];

// The photo is 16:9 and its box is 4:3 (5:4 from 1024px), so object-cover
// draws it about 1.33× (1.42×) wider than the box: the browser must fetch that
// width, not the box's, or it gets a file too small and the photo goes soft.
// Box widths: the full column on phones; about 45vw beside the headline, at
// most 600px.
const HERO_PHOTO_SIZES = "(min-width: 1400px) 852px, (min-width: 1024px) 64vw, 134vw";

export function Hero({ dict, homeHref }: { dict: Dictionary; homeHref: string }) {
  const [a, b, c, d] = dict.hero.lines;
  return (
    <section id="top" aria-labelledby="hero-title" className="bg-lime bg-grid [--grid-line:rgb(11_11_11/0.11)]">
      <div className="wrap grid items-start gap-12 pb-14 pt-28 md:pb-20 md:pt-36 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pt-40">
        <div>
          <h1 id="hero-title" className="font-display text-[clamp(3.6rem,13.5vw,6.5rem)] leading-[0.9] lg:text-[clamp(5rem,8.2vw,8.25rem)]">
            {/* The spaces keep the words apart for search engines and screen readers. */}
            <span className="block">{a}</span>{" "}
            <span className="block">{b}</span>{" "}
            <span className="-ml-2 mt-2 block w-fit -rotate-[1.2deg] bg-ink py-[0.1em] pl-[0.2em] pr-[0.6em] text-lime sm:-ml-3 lg:pr-[1.2em]">
              <span className="block">{c}</span>{" "}
              <span className="block">{d}</span>
            </span>
          </h1>
          <p className="mt-8 max-w-[34rem] text-lg font-medium leading-snug md:mt-10 md:text-[1.4rem]">{dict.hero.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="ink" size="pill" className="h-14 px-7 text-lg">
              <a href={`tel:${mainPhone.tel}`}>{fill(dict.hero.call, { phone: mainPhone.display })}</a>
            </Button>
            <Button asChild variant="paper" size="pill" className="h-14 px-7 text-lg">
              <a href={`${homeHref}#calendar`}>{dict.hero.freeDays}</a>
            </Button>
          </div>
        </div>

        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-ink md:rounded-[2.5rem] lg:aspect-[5/4]">
            <Image
              src={site.photos.hero.src}
              alt={dict.hero.photoAlt}
              fill
              loading="eager"
              fetchPriority="high"
              quality={85}
              sizes={HERO_PHOTO_SIZES}
              // A little right of centre keeps the whiteboard, TV and desks in the middle.
              className="object-cover object-[60%_50%]"
            />
          </div>
          {/* What's in the room: its own dark panel under the photo. */}
          <ul className="mt-3 grid grid-cols-3 divide-x divide-paper/10 rounded-[1.5rem] bg-ink text-paper md:mt-4 md:rounded-[2rem]">
            {dict.hero.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <li key={feature.title} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-3 md:px-6 md:py-5">
                  <Icon aria-hidden className="size-5 shrink-0 text-lime md:size-6" strokeWidth={2.25} />
                  <span className="leading-tight">
                    <span className="block text-[0.95rem] font-extrabold md:text-lg">{feature.title}</span>
                    <span className="block text-xs text-paper/60 md:text-sm">{feature.note}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 bg-cream bg-grid px-4 py-5 [--grid-line:rgb(11_11_11/0.07)] md:flex md:justify-around md:py-7">
        {dict.strip.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[0.95rem] font-bold md:text-lg">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-ink" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
