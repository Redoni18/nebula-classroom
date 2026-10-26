// Prints structured data into the page as <script type="application/ld+json">.
// "<" is escaped so no text inside can close the script tag early.

import type { Graph } from "schema-dts";

export function JsonLd({ data }: { data: Graph }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
