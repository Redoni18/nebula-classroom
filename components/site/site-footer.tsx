// The black footer under every page: wordmark, the home page's sections,
// languages, contact and the privacy notice.

import { fill, type Dictionary } from "@/lib/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { mainPhone, site } from "@/lib/site";
import { Brand } from "./brand";
import { LanguageLinks } from "./language-links";

export function SiteFooter({ locale, path, dict }: { locale: Locale; path: string; dict: Dictionary }) {
  const home = localePath(locale);
  const links = [
    { href: `${home}#top`, label: dict.nav.home },
    { href: `${home}#book`, label: dict.nav.waysToBook },
    { href: `${home}#calendar`, label: dict.nav.calendar },
    { href: `${home}#location`, label: dict.nav.location },
    { href: localePath(locale, "/privacy"), label: dict.footer.privacy },
  ];

  return (
    <footer className="bg-ink bg-grid text-paper [--grid-line:rgb(255_255_255/0.06)]">
      <div className="wrap grid gap-10 border-t border-ink-line py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div className="flex flex-col gap-4">
          <Brand href={`${home}#top`} className="text-lime" />
          <p className="max-w-xs text-paper/70">{dict.footer.tagline}</p>
          <a href={`tel:${mainPhone.tel}`} className="text-2xl font-extrabold tracking-tight hover:text-lime">
            {mainPhone.display}
          </a>
        </div>
        <nav aria-label={dict.footer.pages}>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-paper/50">{dict.footer.pages}</p>
          <ul className="flex flex-col gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="font-semibold hover:text-lime">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-paper/50">{dict.footer.languages}</p>
          <LanguageLinks locale={locale} path={path} label={dict.footer.languages} className="text-base" />
          <p className="mt-6 text-sm text-paper/60">
            {site.address.street[locale]}, {site.address.postalCode} {site.address.city[locale]}
          </p>
        </div>
      </div>
      <div className="wrap border-t border-ink-line py-6 text-sm text-paper/50">
        {fill(dict.footer.rights, { year: new Date().getFullYear(), name: site.name })}
      </div>
    </footer>
  );
}
