// The <html> of every public page, in its language (sq, mk or en): fonts,
// site-wide <head> settings and the three languages prerendered at build time.
// Albanian pages are served without "/sq" (see next.config.ts).

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { isLocale, locales } from "@/lib/i18n/locales";
import { setRequestLocale } from "@/lib/i18n/request-locale";
import { fontStackStyle } from "@/lib/fonts";
import { SITE_URL, site } from "@/lib/site";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#c7e03c",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: site.name,
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  appleWebApp: { title: "Nebula", capable: false },
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} style={fontStackStyle}>
      <body>
        {children}
        <SmoothScroll />
      </body>
    </html>
  );
}
