// How OpenNext runs this Next.js app as a Cloudflare Worker.
//
// Every public page is prerendered at build time and nothing revalidates, so
// the prerendered pages are served from the Worker's static assets (no R2
// bucket or KV needed). Content changes ship with a new deploy.

import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
