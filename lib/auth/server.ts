// Admin sign-in (SPEC §1, step 2): Better Auth with email and password, its
// tables in D1 (lib/db/auth-schema.ts), its routes at /api/auth/*.
//
// - Nobody can sign up: staff accounts are added with
//   `corepack pnpm admin:add` (scripts/add-admin.mjs).
// - Signing in passes Turnstile and is limited per IP address (counted in D1,
//   since a Worker keeps nothing in memory between requests).
// - A session lasts 30 days from the last visit.
//
// The configuration depends on the request's address (the cookie and the
// origin check follow it), so one instance is kept per address.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { captcha } from "better-auth/plugins";

const DAY = 24 * 60 * 60;

function makeAuth(baseURL: string) {
  const { env } = getCloudflareContext();
  const local = baseURL.startsWith("http://localhost") || baseURL.startsWith("http://127.0.0.1");
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    basePath: "/api/auth",
    trustedOrigins: [baseURL],
    telemetry: { enabled: false },
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 10 },
    session: { expiresIn: 30 * DAY, updateAge: DAY },
    advanced: {
      cookiePrefix: "nebula",
      // Cloudflare sets cf-connecting-ip and visitors can't fake it, so the limits count per real address.
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    rateLimit: {
      enabled: !local,
      storage: "database",
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: env.TURNSTILE_SECRET_KEY,
        endpoints: ["/sign-in/email"],
      }),
    ],
  } satisfies BetterAuthOptions);
}

type Auth = ReturnType<typeof makeAuth>;
const instances = new Map<string, Auth>();

/** Better Auth for the site at `origin` ("https://nebulaclassroom.com"). */
export function getAuth(origin: string): Auth {
  let auth = instances.get(origin);
  if (!auth) {
    auth = makeAuth(origin);
    instances.set(origin, auth);
  }
  return auth;
}
