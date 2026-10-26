# Nebula Classroom — SPEC

The new site for Nebula's classroom in Tetovo, replacing the old Vite site
(`~/Desktop/Code/Personal/nebula`, live at nebulacoworkingspace.vercel.app).
Teachers and trainers book the room by the day, week or month, or take it
exclusively for a month. The site shows which hours are free, takes the booking
request and stores it, and the owner confirms it.

The design reference is `design/Website.pdf` (one long desktop page). Every page
follows it: lime/ink/cream palette, the square grid behind sections, heavy
uppercase headlines with one word on a lime or ink box, pill buttons. It's a
starting point, not a spec to copy: parts that look out of place get redesigned
(2026-10-26: the hero's egg-shaped WiFi/A/C/TV pills became a black caption band
under the photo; the "What will you teach" cards are all dark, lime only under
the pointer).

## 1. Decisions

| Topic | Decision | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Asked for. |
| UI | Tailwind v4 + shadcn (Radix), tokens in `app/globals.css` | Asked for. Light only, no dark mode. |
| Hosting | Cloudflare Workers through OpenNext (`@opennextjs/cloudflare`) | D1 is only practical from a Worker (from Vercel it would be an HTTP API per query). The Cloudflare account already pays Workers Paid, so no new base fee. |
| Database | Cloudflare D1 (EU jurisdiction), Drizzle ORM, SQL migrations in `migrations/` | Same setup as Highreel. |
| Languages | Albanian (default, at `/`), Macedonian (`/mk`), English (`/en`) | Tetovo's two languages plus English. No automatic redirects by browser language (Google advises against them); hreflang tells search engines which page is which. |
| Fonts | Archivo (the design's font; variable width + weight) + Inter Tight for Cyrillic only | Archivo has no Cyrillic. The browser falls back per letter, so Macedonian text uses Inter Tight and Latin stays Archivo. The stack is built in `app/[locale]/layout.tsx` (next/font's own Arial fallback would catch Cyrillic first). |
| Dates in the browser | Month and weekday names written out in `lib/i18n/calendar-names.ts` | Chrome has no Albanian or Macedonian date names (Intl falls back to English). |
| Build | `next build` (standalone output) then `opennextjs-cloudflare build --skipNextBuild`; `wrangler` called directly (`OPEN_NEXT_DEPLOY=true` stops `wrangler deploy` from handing over to OpenNext's) | OpenNext's own preview/deploy spawn `pnpm`, which isn't on PATH on this Mac (only `corepack pnpm`). |
| Scrolling | Lenis (`components/site/smooth-scroll.tsx`): eased wheel scrolling and smooth jumps to #sections | Native scrolling felt jittery to the user (2026-10-26). Off for visitors who ask for reduced motion. |
| Forms | shadcn Field, Input, Select, Textarea, styled cream with an ink focus | Asked for (no native select menus). |
| Page cache | OpenNext static-assets cache: prerendered pages served from the Worker's assets | Nothing revalidates; no R2/KV needed. `populateCache` must run before `wrangler dev`/`deploy` (the scripts do it). |
| Spam protection | Cloudflare Turnstile + honeypot field + 5 requests per hour per IP | Turnstile is what the other projects use. |
| Payments | None. Prices are given per request ("Ask for a quote"); payment happens in person. | The design has no prices. |
| Admin sign-in | Better Auth, email + password, sign-up closed, users added by `corepack pnpm admin:add` | One or two admins; no email setup needed to sign in. Turnstile + 5 tries a minute per IP on sign-in. |
| Admin changes | Server actions (`features/admin/actions.ts`), each checking the session, all hour changes in one D1 batch (`manage-booking.ts`) | Declined/cancelled free their hours; reopening takes them again only if still free. Closed days count as fully taken for visitors and can't be set on a day with bookings. |

## 2. Business facts (single source: `lib/site.ts`)

- Name: **Nebula Classroom** (the design's name). Old name "Nebula Co-Working Space" stays as `alternateName` in structured data so the brand searches carry over.
- Address: Rr. 19 Nëntori, Kompleksi Lovec, 1200 Tetovë, North Macedonia (MK: Ул. 19 Ноември, Комплекс Ловец, 1200 Тетово).
- Phones: 075 281 813 (main, on every button), 070 470 555.
- Email: nebulacoworkinspace@gmail.com (the address the old site's form sent to).
- Instagram: https://www.instagram.com/nebulacowork_te/
- Hours: open every day; bookable hours 08:00–22:00 (slots start 8:00…21:00).
- Equipment: fast WiFi, A/C, TV + whiteboard, desks and chairs, bathroom and kitchen, city parking nearby.

- Map: https://www.google.com/maps?cid=11055459592570318201 (pin at 42.0110776,
  20.9717364; on Maps it's named by its plus code 2X6C+CPM, not "Nebula").

Open: whether the room gets a Google Business Profile (see §9).

## 3. Pages and addresses

| Address | What |
|---|---|
| `/`, `/mk`, `/en` | Home: hero, highlights strip, "What will you teach here?", "Ways to book" + booking calendar, "Everything included", location, footer |
| `/privacy` (+ `/mk/…`, `/en/…`) | Privacy notice (what the booking form keeps and why) |
| `/sq/*` | 301 to the same page without `/sq` (one address per page) |
| `/api/availability?from=&to=` | Taken hours per day, no personal data |
| `POST /api/bookings` | Create a booking request |
| `/admin/*` | Admin (step 2), not indexed |

Locale routing lives in `next.config.ts` (rewrites `/x` → `/sq/x` internally,
redirects `/sq/x` → `/x`). The page code is in `app/[locale]/…` for all three.

Step 4 adds one page per activity card (the arrows on "What will you teach
here?") with localized slugs, e.g. `/kurse-gjuhesh`, `/mk/kursevi-za-jazici`,
`/en/language-courses`.

## 4. Booking model

### Plans

| Plan | What the visitor picks | Stored as | Minimum |
|---|---|---|---|
| Day pass | one day + one block of hours | 1 session | 1 hour |
| Week | up to 7 days within 7 days of the first, a block of hours on each | 1–7 sessions | 4 hours in total |
| Month | the days + hours of one week; they repeat for 4 weeks | the week's sessions × 4 | 16 hours in total (4 a week) |
| Exclusive month | a start day | every day for 30 days, all open hours | — |

All limits live in `features/booking/model/rules.ts`, shared by the browser
and the server. The earliest bookable hour is 24 hours from now (Europe/Skopje
time); the calendar goes 6 months ahead.

The server never trusts the browser's expansion: for Month it receives the
first week and repeats it itself; for Exclusive it receives the start day.

### Tables (`lib/db/schema.ts`)

- `bookings`: one request. `code` (short reference shown to the visitor),
  `plan`, `status` (`pending` → `confirmed` | `declined` | `cancelled`),
  contact details (`name`, `phone`, `email?`), `activity`, `group_size?`,
  `message?`, `locale`, `source` (`web` | `admin`), `total_hours`,
  `first_date`, `last_date`, `admin_note?`, `ip_hash?`, timestamps,
  `archived_at?`.
- `booking_sessions`: the blocks asked for (`date`, `start_hour`,
  `end_hour`). Kept as the record even after a decline.
- `held_hours`: one row per held hour, primary key (`date`, `hour`). Inserting
  the booking, its sessions and its hours is one D1 batch (a transaction), so
  two people can never hold the same hour: the second insert fails on the key
  and nothing of that request is saved. Declining or cancelling deletes the
  booking's held hours, which frees them.

Pending requests hold their hours (first come, first served); the owner frees
them by declining. The public calendar shows held hours as taken, without
saying by whom.

### Flow

1. Visitor picks a plan ("Ask for a quote" on a plan selects it in the calendar).
2. Picks day(s) and hours. Outlined day = some hours taken; ink day = full.
3. "Continue" → details: name, phone, email (optional), what they'll teach,
   group size, note. Turnstile.
4. "Send request" → `POST /api/bookings` → reference code on screen: "We'll
   call you to confirm." "Book by phone" stays available throughout.
5. Owner confirms or declines in the admin (step 2) and gets notified of new
   requests (step 3).

## 5. SEO checklist

Rendering and speed
- [x] Every public page is prerendered HTML at build time; only the header menu and the booking widget run in the browser.
- [x] Fonts self-hosted by `next/font` with size-adjusted fallbacks (no layout shift); Cyrillic file loads only when Cyrillic text is on the page.
- [x] Hero photo: `fetchPriority="high"`, responsive `sizes`, AVIF through Cloudflare Images (OpenNext `IMAGES` binding).
- [x] Lighthouse on the local Worker (2026-10-26): desktop 100/100/100/100; phone 91 performance, 100 accessibility, 100 best practices, 100 SEO, layout shift 0. The local server doesn't compress, so re-check phone performance on production (step 5).

Indexing
- [x] `<html lang>` per language; one `h1` per page; headings in order.
- [x] Title and description per language, written for the searches people make ("sallë mësimi me qira Tetovë", "училница за изнајмување Тетово", "classroom for rent Tetovo").
- [x] Canonical URL on every page; hreflang `sq`, `mk`, `en` and `x-default` (→ `/`).
- [x] `sitemap.xml` with every page and its language alternates, plus the photos.
- [x] `robots.txt`: everything allowed except `/api/` and `/admin`; points to the sitemap.
- [x] 404 page returns status 404; `/sq/*` redirects permanently (308) to one address.
- [x] Security headers (HSTS, nosniff, referrer policy, permissions policy).

Rich results and sharing
- [x] JSON-LD graph: `LocalBusiness` (address, phones, opening hours, photos, amenities, the 4 plans as offers, Instagram, old name), `WebSite`, `WebPage` per language; `BreadcrumbList` on inner pages.
- [x] Open Graph + Twitter card per language, with a 1200×630 image per language generated at build time in the site's style.
- [x] Web manifest, favicon, SVG icon, Apple touch icon, theme colour.
- [x] `llms.txt`: plain summary for AI search tools.

Off-site (launch, step 5)
- [ ] Production domain; www → apex redirect.
- [ ] Google Search Console + Bing Webmaster: verify, submit sitemap.
- [ ] Old site: 301 every path to the new domain (Vercel redirect).
- [ ] Google Business Profile: same name, address, phone as the site (NAP), website link, photos.
- [ ] Instagram bio link → new domain.
- [ ] Map coordinates in the JSON-LD (`geo`) and a map link.

## 6. Folder layout

`app/` addresses only · `features/` page code (home, booking, admin, seo) · `components/` shared pieces and shadcn · `lib/` site facts, languages, database, auth.

## 7. Steps (one session each)

1. **Foundation + public site** (done 2026-10-26) — scaffold, tokens, i18n routing and copy in 3
   languages, home page per the design, privacy page, SEO checklist above, D1
   schema + migration, availability API, booking widget, booking requests saved
   to D1 (local).
2. **Admin** (done 2026-10-26) — Better Auth (email + password, D1), `/admin` in the dashboard-01
   frame: bookings table (filter by status; ⋯ confirm / decline / edit /
   archive / delete), add a booking by hand (phone bookings, `source: admin`),
   week view of the room, closed days (holidays) that the public calendar
   respects.
3. **Notifications** (done 2026-10-26) — the owner gets an email for every
   new request (`features/booking/server/notify.ts`), in Albanian, to
   nebulacoworkinspace@gmail.com, from bookings@nebulaclassroom.com through
   Cloudflare Email Sending (binding `EMAIL`); replies go to the client's email.
   Sent after the request is saved (`waitUntil`), so a failed email never loses
   a booking. Locally the emulated email lands in `.wrangler/tmp/email/`. Email
   only (no SMS/Telegram) and no emails to visitors, by the user's choice.
   Email Sending was enabled on nebulaclassroom.com on 2026-10-26 (SPF, DKIM,
   DMARC and bounce MX records are live; check with
   `wrangler email sending dns get nebulaclassroom.com`).
4. **SEO content** — the four activity pages with localized slugs, an FAQ
   section, internal links between them, breadcrumbs.
5. **Launch** (live 2026-10-26) — done: D1 `nebula-classroom` (EU
   jurisdiction) with migrations, Turnstile site key in `.env.production`,
   Worker secrets IP_HASH_SALT and BETTER_AUTH_SECRET, custom domains
   nebulaclassroom.com and www (www → 308 to the apex), first deploy.
   Left: the TURNSTILE_SECRET_KEY secret (the user adds it; until then the
   booking form and admin sign-in refuse everyone), the admin account
   nebulacoworkinspace@gmail.com (`admin:add --remote`, the user picks the
   password), the 301 from the old Vercel site, the off-site list in §5,
   Lighthouse and Rich Results checks on the live site.

## 8. Running it

In short: `corepack pnpm install`,
`corepack pnpm db:migrate:local`, `corepack pnpm dev`; `corepack pnpm preview`
runs the real Worker locally. Publishing: `corepack pnpm db:migrate:remote` when
there's a new migration, then `corepack pnpm run deploy` (with `run`: a bare
`pnpm deploy` is pnpm's own command).

## 9. Open questions

- ~~Production domain~~: **nebulaclassroom.com**, bought 2026-10-26 (in `.env.production`).
- ~~Exact location~~: the owner's Maps link and pin (§2), used for `geo` and the map button.
- Any prices to show, or always "Ask for a quote"?
- Admin language: built in plain standard Albanian (`features/admin/copy.ts`, one file to translate if English is wanted).
- ~~Notifications~~: email to nebulacoworkinspace@gmail.com (2026-10-26). The same address is the admin login.
- Native-speaker check of the Macedonian copy.
