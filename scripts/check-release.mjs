// Runs before `corepack pnpm deploy`: stops a production build that would
// publish wrong addresses or a booking form that refuses everyone.
// Reads .env.production (public settings) and wrangler.jsonc.

import { readFileSync } from "node:fs";

const problems = [];
const env = Object.fromEntries(
  (() => {
    try {
      return readFileSync(".env.production", "utf8")
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#"))
        .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]);
    } catch {
      return [];
    }
  })(),
);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl || !siteUrl.startsWith("https://") || siteUrl.includes("localhost")) {
  problems.push("NEXT_PUBLIC_SITE_URL must be the https production address (canonical links, sitemap, share images all use it).");
}
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
if (!siteKey || siteKey.startsWith("1x0000") || siteKey.startsWith("2x0000") || siteKey.startsWith("3x0000")) {
  problems.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY must be the real widget's key, not a test key.");
}
const wrangler = readFileSync("wrangler.jsonc", "utf8");
if (wrangler.includes('"database_id": "00000000-0000-0000-0000-000000000000"')) {
  problems.push("wrangler.jsonc still has the placeholder D1 database_id: create the database (SPEC step 5) and put its id there.");
}

if (problems.length) {
  console.error("Not deploying:\n- " + problems.join("\n- "));
  console.error("Also make sure the Worker secrets exist: wrangler secret put TURNSTILE_SECRET_KEY / IP_HASH_SALT.");
  process.exit(1);
}
console.log("Release checks passed.");
