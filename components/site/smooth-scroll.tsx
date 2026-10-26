"use client";

// Smooth, eased scrolling for the whole page (Lenis), and smooth jumps for
// links to a section of the same page ("/#book", "/mk#calendar"). Jumps stop
// under the floating header because Lenis honours the page's
// scroll-padding-top (app/globals.css). Visitors who ask their system for
// reduced motion get plain scrolling (Lenis's respectReducedMotion).
//
// Other code scrolls through scrollToElement() so it goes through the same
// animation instead of fighting it.

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

let lenis: Lenis | null = null;

/** How long a jump to a section takes, in seconds. */
const JUMP_SECONDS = 1.1;

export function scrollToElement(element: HTMLElement) {
  if (lenis) lenis.scrollTo(element, { duration: JUMP_SECONDS });
  else element.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SmoothScroll() {
  useEffect(() => {
    const instance = new Lenis({
      autoRaf: true,
      // Scrolling inside the phone menu and open dropdowns stays theirs.
      prevent: (node) => !!node.closest("[data-slot=sheet-content], [data-slot=sheet-overlay], [data-slot=select-content]"),
    });
    lenis = instance;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href*='#']");
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      instance.scrollTo(target, { duration: JUMP_SECONDS });
      history.pushState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
