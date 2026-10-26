// Any address under a language that isn't a page ("/old-page", "/mk/xyz"):
// answers with the 404 page in that language instead of Next's bare one.

import { notFound } from "next/navigation";

export default function MissingPage() {
  notFound();
}
