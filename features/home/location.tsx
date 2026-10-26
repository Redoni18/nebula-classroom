// "Find the room": where the classroom is, when it's open and how to reach
// us, on black so it runs into the footer. The entrance photo is here because
// it's what people look for when they arrive (the green Nebula sign).

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/site/heading";
import { Button } from "@/components/ui/button";
import { fill, type Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { site } from "@/lib/site";

export function Location({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const l = dict.location;
  return (
    <section aria-labelledby="location-title" className="bg-cream">
      <div className="rounded-t-[2.5rem] bg-ink bg-grid pb-16 pt-16 text-paper [--grid-line:rgb(255_255_255/0.07)] md:rounded-t-[3.5rem] md:pb-24 md:pt-24">
        <div id="location" className="wrap grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading id="location-title" parts={l.title} />
            <address className="mt-10 grid gap-8 not-italic sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-paper/50">{l.addressLabel}</p>
                <p className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">
                  {site.address.street[locale]}
                  <br />
                  {site.address.postalCode} {site.address.city[locale]}, {site.address.country[locale]}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-paper/50">{l.hoursLabel}</p>
                <p className="mt-2 text-lg font-semibold">{fill(l.hours, { opens: site.hours.opens, closes: site.hours.closes })}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-paper/50">{l.phoneLabel}</p>
                <ul className="mt-2 text-lg font-semibold">
                  {site.phones.map((phone) => (
                    <li key={phone.tel}>
                      <a href={`tel:${phone.tel}`} className="hover:text-lime">
                        {phone.display}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-paper/50">{l.emailLabel}</p>
                <a href={`mailto:${site.email}`} className="mt-2 block break-all text-lg font-semibold hover:text-lime">
                  {site.email}
                </a>
              </div>
            </address>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="lime" size="pill" className="h-14 px-7 text-lg">
                <a href={site.mapUrl} target="_blank" rel="noopener">
                  {l.directions} <ArrowUpRight />
                </a>
              </Button>
              <Button asChild variant="paper" size="pill" className="h-14 px-7 text-lg">
                <a href={site.instagram} target="_blank" rel="noopener me">
                  {l.instagram} <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>

          <figure>
            <div className="relative aspect-[16/11] overflow-hidden rounded-[2rem] md:rounded-[2.5rem]">
              {/* 16:9 photo in a 16:11 box: drawn about 1.22× the box's width (see hero.tsx). */}
              <Image src={site.photos.entrance.src} alt={l.entranceAlt} fill quality={85} sizes="(min-width: 1400px) 790px, (min-width: 1024px) 56vw, 122vw" className="object-cover" />
            </div>
            <figcaption className="mt-4 inline-block -rotate-1 bg-lime px-3 py-1 text-base font-extrabold text-ink">{l.entrance}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
