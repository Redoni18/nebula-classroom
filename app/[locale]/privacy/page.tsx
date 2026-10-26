// The privacy notice ("/privacy", "/mk/privacy", "/en/privacy"). Its text is in
// the dictionaries (privacy.*); the layout is in features/legal.

import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { PrivacyNotice } from "@/features/legal/privacy-notice";
import { JsonLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { innerPageGraph } from "@/features/seo/structured-data";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/privacy", title: dict.privacy.title, description: dict.privacy.description, ogAlt: dict.meta.ogAlt });
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  return (
    <PageShell locale={locale} path="/privacy">
      <JsonLd data={innerPageGraph(locale, dict, "/privacy", dict.privacy.title, dict.privacy.description)} />
      <PrivacyNotice locale={locale} dict={dict} />
    </PageShell>
  );
}
