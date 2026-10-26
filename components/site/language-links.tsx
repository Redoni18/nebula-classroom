// "SQ · MK · EN": links to the same page in each language. The current
// language is marked (aria-current) rather than linked.

import { cn } from "@/lib/utils";
import { localeInfo, localePath, locales, type Locale } from "@/lib/i18n/locales";

export function LanguageLinks({
  locale,
  path,
  label,
  className,
}: {
  locale: Locale;
  /** This page's path without the language ("/" or "/privacy"). */
  path: string;
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("flex items-center gap-1.5 text-sm font-semibold", className)}>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>·</span>}
          {l === locale ? (
            <span aria-current="true" className="font-extrabold underline decoration-2 underline-offset-4">
              {localeInfo[l].label}
            </span>
          ) : (
            <a href={localePath(l, path)} hrefLang={l} lang={l} title={localeInfo[l].name} className="opacity-70 transition-opacity hover:opacity-100">
              {localeInfo[l].label}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
