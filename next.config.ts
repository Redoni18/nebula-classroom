// Next.js settings: language addresses, security headers, images, and the
// link to Cloudflare's local bindings (D1) while `next dev` runs.
//
// Languages (SPEC §3): Albanian lives at the root ("/", "/privacy"), Macedonian
// and English under "/mk" and "/en". All three are rendered by app/[locale]/…,
// so an Albanian address is rewritten internally to "/sq/…", and anyone who
// types "/sq/…" is sent (301) to the address without it: one URL per page.

import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Top-level paths that are not Albanian pages: the other languages, the API,
// the admin, Next's own files, and anything with a file extension.
const NOT_ALBANIAN = "(?!(?:sq|mk|en|api|admin|_next)(?:/|$))(?!.*\\.[a-z0-9]+$)";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // The self-contained server build OpenNext turns into the Worker (package.json
  // runs `next build` itself, then `opennextjs-cloudflare build --skipNextBuild`).
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // The photos ask for 85 (the default 75 softens these phone photos).
    qualities: [75, 85],
  },
  async redirects() {
    return [
      // www is attached to the Worker only to send people to the one address.
      { source: "/:path*", has: [{ type: "host", value: "www.nebulaclassroom.com" }], destination: "https://nebulaclassroom.com/:path*", permanent: true },
      { source: "/sq", destination: "/", permanent: true },
      { source: "/sq/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/sq" },
        { source: `/:path(${NOT_ALBANIAN}.*)`, destination: "/sq/:path" },
      ],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;

// Gives `next dev` the same bindings as the Worker (D1 from .wrangler/state).
initOpenNextCloudflareForDev();
