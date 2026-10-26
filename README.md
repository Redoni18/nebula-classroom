# Nebula Classroom

Website and booking admin for nebulaclassroom.com. Next.js on Cloudflare Workers with D1.

```bash
corepack pnpm install
corepack pnpm db:migrate:local   # local database
corepack pnpm dev                # http://localhost:3000, admin at /admin
corepack pnpm run deploy         # build and publish to nebulaclassroom.com
```

Add an admin account: `corepack pnpm admin:add -- --email you@example.com --name "Name"` (add `--remote` for the live database).

Plan and decisions: [SPEC.md](SPEC.md).
