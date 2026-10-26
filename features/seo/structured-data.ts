// Structured data (JSON-LD) that tells search engines what the business is:
// a LocalBusiness with address, phones, hours, photos, equipment and the four
// plans, plus the WebSite and each WebPage. One business (@id) shared by all
// three languages, described in the page's language.

import type { BreadcrumbList, Graph, LocalBusiness, WebPage, WebSite } from "schema-dts";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { absoluteUrl, localeInfo, locales, type Locale } from "@/lib/i18n/locales";
import { SITE_URL, site } from "@/lib/site";
import { plans } from "@/features/booking/model/rules";
import { pageTitle } from "./metadata";

const BUSINESS_ID = `${SITE_URL}/#business`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function business(locale: Locale, dict: Dictionary): LocalBusiness {
  return {
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: site.name,
    alternateName: site.alternateName,
    description: dict.meta.description,
    url: absoluteUrl("sq"),
    telephone: site.phones[0].international,
    email: site.email,
    image: Object.values(site.photos).map((p) => `${SITE_URL}${p.src}`),
    logo: `${SITE_URL}/icon-512.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street[locale],
      addressLocality: site.address.city[locale],
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    geo: { "@type": "GeoCoordinates", ...site.geo },
    hasMap: site.mapUrl,
    areaServed: { "@type": "City", name: site.address.city[locale] },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: site.hours.opens,
      closes: site.hours.closes,
    },
    contactPoint: site.phones.map((phone) => ({
      "@type": "ContactPoint",
      telephone: phone.international,
      contactType: "reservations",
      availableLanguage: ["sq", "mk", "en"],
    })),
    amenityFeature: dict.included.items.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
    knowsLanguage: ["sq", "mk", "en"],
    sameAs: [site.instagram],
    makesOffer: plans.map((plan) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: dict.plans.items[plan].name,
        description: dict.plans.items[plan].text,
        serviceType: dict.meta.title,
        provider: { "@id": BUSINESS_ID },
        areaServed: { "@type": "City", name: site.address.city[locale] },
      },
    })),
  };
}

function website(): WebSite {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: site.name,
    alternateName: site.alternateName,
    inLanguage: [...locales],
    publisher: { "@id": BUSINESS_ID },
  };
}

function webPage(locale: Locale, path: string, name: string, description: string, extra: Partial<WebPage> = {}): WebPage {
  const url = absoluteUrl(locale, path);
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: localeInfo[locale].intl.split("-")[0],
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": BUSINESS_ID },
    ...extra,
  } as WebPage;
}

export function homeGraph(locale: Locale, dict: Dictionary): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      business(locale, dict),
      website(),
      webPage(locale, "/", pageTitle("/", dict.meta.title), dict.meta.description, {
        primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}${site.photos.hero.src}`, caption: dict.hero.photoAlt },
      }),
    ],
  };
}

export function innerPageGraph(locale: Locale, dict: Dictionary, path: string, name: string, description: string): Graph {
  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(locale, path)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.nav.home, item: absoluteUrl(locale) },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(locale, path) },
    ],
  };
  return {
    "@context": "https://schema.org",
    "@graph": [business(locale, dict), website(), webPage(locale, path, name, description, { breadcrumb: { "@id": breadcrumb["@id"] as string } }), breadcrumb],
  };
}
