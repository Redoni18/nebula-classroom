"use client";

// The floating white bar at the top of every page: wordmark, the home page's
// sections, languages and the phone number. On the home page the link of the
// section in view is marked lime (as "Home" is in the design). Below 1024px
// the links move into a slide-in menu.

import { useEffect, useRef, useState } from "react";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { mainPhone } from "@/lib/site";
import { Brand } from "./brand";
import { LanguageLinks } from "./language-links";

const SECTIONS = ["top", "book", "calendar", "location"] as const;
type SectionId = (typeof SECTIONS)[number];

export function SiteHeader({
  locale,
  path,
  homeHref,
  nav,
  spy,
}: {
  locale: Locale;
  path: string;
  homeHref: string;
  nav: Dictionary["nav"];
  /** Mark the section in view (home page only). */
  spy: boolean;
}) {
  const [active, pin] = useSectionInView(spy);
  const links: { id: SectionId; label: string }[] = [
    { id: "top", label: nav.home },
    { id: "book", label: nav.waysToBook },
    { id: "calendar", label: nav.calendar },
    { id: "location", label: nav.location },
  ];
  const href = (id: SectionId) => `${homeHref}#${id}`;

  return (
    <header className="fixed inset-x-0 top-3 z-40 md:top-5">
      <div className="wrap">
        <div className="flex h-16 items-center justify-between gap-4 rounded-full bg-paper pl-6 pr-2 shadow-[0_8px_30px_rgb(11_11_11/0.08)] md:h-[4.5rem] md:pl-8 md:pr-3">
          <Brand href={href("top")} />

          <nav aria-label={nav.menu} className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <a
                key={link.id}
                href={href(link.id)}
                onClick={() => pin(link.id)}
                aria-current={spy && active === link.id ? "location" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-cream",
                  spy && active === link.id && "bg-lime font-bold hover:bg-lime",
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageLinks locale={locale} path={path} label={nav.language} className="hidden rounded-full border-2 border-cream-line px-4 py-2 sm:flex" />
            <Button asChild variant="ink" size="pill" className="hidden h-12 px-6 text-base md:inline-flex md:h-14 md:px-8 md:text-lg">
              <a href={`tel:${mainPhone.tel}`}>{mainPhone.display}</a>
            </Button>
            <Button asChild variant="ink" size="pill-icon" className="md:hidden">
              <a href={`tel:${mainPhone.tel}`} aria-label={`${nav.call} ${mainPhone.display}`}>
                <Phone />
              </a>
            </Button>
            <MobileMenu locale={locale} path={path} nav={nav} links={links.map((l) => ({ ...l, href: href(l.id) }))} />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({
  locale,
  path,
  nav,
  links,
}: {
  locale: Locale;
  path: string;
  nav: Dictionary["nav"];
  links: { id: string; label: string; href: string }[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="paper" size="pill-icon" className="border-2 border-cream-line lg:hidden" aria-label={nav.menu}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 border-none bg-lime bg-grid p-0 [--grid-line:rgb(11_11_11/0.1)] sm:max-w-sm">
        <SheetTitle className="sr-only">{nav.menu}</SheetTitle>
        <SheetDescription className="sr-only">Nebula Classroom</SheetDescription>
        <nav aria-label={nav.menu} className="flex flex-col gap-1 px-6 pt-20">
          {links.map((link) => (
            <SheetClose asChild key={link.id}>
              <a href={link.href} className="font-display py-2 text-[2.5rem]">
                {link.label}
              </a>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4 px-6 pb-10">
          <LanguageLinks locale={locale} path={path} label={nav.language} className="text-lg" />
          <Button asChild variant="ink" size="pill" className="h-14 text-lg">
            <a href={`tel:${mainPhone.tel}`}>
              <Phone /> {mainPhone.display}
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The section in view: the last one whose top has passed 40% of the screen.
 * Sections that start at the same height (on wide screens the plans and the
 * calendar sit side by side) count as one, the first. A link that was just
 * clicked stays marked while its section is where the jump left it.
 */
function useSectionInView(enabled: boolean): [SectionId, (id: SectionId) => void] {
  const [active, setActive] = useState<SectionId>("top");
  const pinned = useRef<{ id: SectionId; at: number } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const landing = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (pinned.current) {
        const { id, at } = pinned.current;
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        // During the smooth jump (up to 1.5 s), or once it has landed, the clicked link stays marked.
        if (Date.now() - at < 1500 || (top !== undefined && Math.abs(top - landing) < 40)) return setActive(id);
        pinned.current = null;
      }
      const line = window.innerHeight * 0.4;
      let current: SectionId = "top";
      let currentTop = -Infinity;
      for (const id of SECTIONS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top === undefined || top > line) continue;
        if (Math.abs(top - currentTop) < 80) continue;
        current = id;
        currentTop = top;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);
  const pin = (id: SectionId) => {
    pinned.current = { id, at: Date.now() };
    setActive(id);
    // Look again when the jump's window ends, in case the visitor scrolled on meanwhile.
    window.setTimeout(() => window.dispatchEvent(new Event("scroll")), 1600);
  };
  return [active, pin];
}
