// The 404 page, in the language of the address that wasn't found. Next sends
// it with status 404, so search engines drop the address.

import { PageShell } from "@/components/site/page-shell";
import { Marked } from "@/components/site/heading";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localePath } from "@/lib/i18n/locales";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default function NotFound() {
  const locale = getRequestLocale();
  const dict = getDictionary(locale);
  return (
    <PageShell locale={locale} path="/">
      <div className="bg-lime bg-grid pb-24 pt-36 [--grid-line:rgb(11_11_11/0.11)] md:pb-32 md:pt-48">
        <div className="wrap">
          <p className="font-display text-[clamp(5rem,18vw,12rem)]">
            <Marked tone="ink">404</Marked>
          </p>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight md:text-5xl">{dict.notFound.title}</h1>
          <p className="mt-4 max-w-lg text-lg">{dict.notFound.text}</p>
          <Button asChild variant="ink" size="pill" className="mt-8 h-14 px-7 text-lg">
            <a href={localePath(locale)}>{dict.notFound.home}</a>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
