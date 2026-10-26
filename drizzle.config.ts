// drizzle-kit settings: `corepack pnpm db:generate` turns lib/db/schema.ts and
// lib/db/auth-schema.ts into
// a new SQL migration in migrations/, which wrangler then applies to D1.

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./lib/db/schema.ts", "./lib/db/auth-schema.ts"],
  out: "./migrations",
});
