// What every public page sits in: the skip link, the header, the page's own
// content and the footer. Each page passes its path ("/" or "/privacy") so the
// language links point at the same page in the other languages.

import { getDictionary } from "@/lib/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageShell({ locale, path, children }: { locale: Locale; path: string; children: React.ReactNode }) {
  const dict = getDictionary(locale);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-bold focus:text-paper"
      >
        {dict.nav.skip}
      </a>
      <SiteHeader locale={locale} path={path} homeHref={localePath(locale)} nav={dict.nav} spy={path === "/"} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} path={path} dict={dict} />
    </>
  );
}
