// Picks the copy for a language (server side: client components get the
// slice they need as a prop). fill() and plural() live in ./text.

import { en, type Dictionary } from "./dictionaries/en";
import { mk } from "./dictionaries/mk";
import { sq } from "./dictionaries/sq";
import type { Locale } from "./locales";

const dictionaries: Record<Locale, Dictionary> = { sq, mk, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export { fill, plural } from "./text";
export type { Dictionary };
