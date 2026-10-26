// The database for the current request: Cloudflare D1 through Drizzle.
// In `next dev` the D1 binding is the local copy in .wrangler/state
// (next.config.ts sets that up); on Cloudflare it's the real database.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
