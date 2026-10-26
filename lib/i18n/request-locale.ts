// The current request's language, for the parts of a page that aren't handed
// the URL's parameters (the 404 page). The layout sets it; React's cache()
// keeps it for the length of one request (one render), never across visitors.

import { cache } from "react";
import { defaultLocale, type Locale } from "./locales";

const store = cache(() => ({ locale: defaultLocale as Locale }));

export function setRequestLocale(locale: Locale) {
  store().locale = locale;
}

export function getRequestLocale(): Locale {
  return store().locale;
}
