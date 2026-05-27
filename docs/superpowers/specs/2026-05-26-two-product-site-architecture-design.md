# Two-Product Site Architecture — Design Spec

**Date:** 2026-05-26
**Status:** Approved for implementation planning
**Source handoff:** `/Users/barris/Desktop/Downloads/design_handoff_two_product_site/README.md`

## Why

The TeeAhead homepage today addresses two audiences on one URL — course operators (the buyer, who sees the `$94,500.` hero) and golfers (the loyalty member, with no purpose-built landing page). Distribution channels (IG bios, scorecard QR codes, member email links) currently have nowhere good to send golfers; they land on `/` and see operator-targeted copy.

This work ships **Variation E** from the handoff: the homepage stays operator-first (with a small escape hatch for golfers), and every partner course gets a real golfer-facing landing page at `/play/[slug]`. Operators get a distribution asset kit so they can drive golfers there.

## Scope

Four deliverables, shipped sequentially to `qa.teeahead.com` for review before merge to `main`:

1. **Homepage reshape** — operator eyebrow + dismiss-able golfer escape banner.
2. **`/play/[slug]`** — new public course landing page.
3. **`/courses`** — new public directory page (stub).
4. **`/course/[slug]/marketing`** — new operator-only asset kit + day-zero onboarding link.

### In scope

- Eyebrow `SOFTWARE FOR GOLF COURSE OPERATORS` above the `$94,500.` H1 on the homepage (Hole 01).
- `GolferEscapeBanner` at the bottom of Hole 01, dismiss-able via `localStorage`, linking to `/courses`.
- `/play/[slug]` server-rendered, `revalidate: 300`, public, `notFound()` on unknown slug.
- `/courses` server-rendered list of active courses, each linking to `/play/[slug]`.
- `/course/[slug]/marketing` operator-only (guarded by `requireManager`), housing `CourseAssetsKit`: slug URL with copy button, downloadable QR PNG, IG bio copy, scorecard footer copy, email signature snippet.
- `DayZeroOnboarding` gets a fourth step linking to `/course/[slug]/marketing`.
- Four `track()` events via `@vercel/analytics`.

### Out of scope (explicit non-goals)

- Removing or hiding golfer-targeted content from existing homepage Holes 03/04/06.
- Migrating any existing copy to `content_blocks`.
- Per-course OG images for `/play/[slug]` (static fallback for v1).
- Average savings line on the `/play/[slug]` hero (no `course_membership_stats` data; deferred).
- Filter selector on the tee-times grid (static "2 PLAYERS · 18 HOLES" label).
- `/auth/sign-in?returnTo=...` (current login doesn't support `returnTo`; sign-in link uses the bare login URL).
- Adopting PostHog or any new analytics provider.
- Rendering `courses.hero_image_url` as a hero background (read in query for future use, not displayed in v1).
- New migrations, new dependencies, new env vars, new cron entries.

## Decisions log

| Decision | Choice | Why |
|---|---|---|
| Homepage cleanup depth | Eyebrow + banner only | Lowest blast radius; preserves the 9-hole narrative; banner gives us the diagnostic event |
| `/play/[slug]` vs `/book/[slug]` | Separate routes | `/play` = marketing skin; `/book` = booking action; tiles on /play deep-link to /book |
| Copy management | Hard-code | Matches existing homepage pattern; `content_blocks` migration is a separate sprint |
| Analytics | `@vercel/analytics` direct | Already installed; covers the `homepage_golfer_banner_clicked` diagnostic the handoff needs |
| Asset kit home | Dedicated `/course/[slug]/marketing` route + day-zero link | Permanent retrieval surface + onboarding discoverability |
| Banner destination | Stub `/courses` as a simple public list | Full persona-escape route per the handoff |
| Component namespacing | `src/components/play/`, `src/components/marketing/`, `src/components/home/` | Audience boundaries stay legible as the surface grows |
| Tee-times rendering | No suspense boundary in v1 | `revalidate: 300` absorbs latency; fewer states to test |
| Hero CTA price | "Get the pass · $89/mo" (Eagle tier) | Honest entry-tier price; matches what /join shows |
| Hero background | Solid green v1 | Visual consistency regardless of `hero_image_url` quality |
| Ship strategy | One qa push per deliverable | Tight feedback loop; problems caught at the unit level |

## Architecture

### Route + file layout

```
src/app/
├── page.tsx                              # MODIFIED — eyebrow + escape banner
├── courses/
│   └── page.tsx                          # NEW — public directory stub
├── play/
│   └── [slug]/
│       └── page.tsx                      # NEW — public course landing
├── course/
│   └── [slug]/
│       ├── dashboard/page.tsx            # MODIFIED — add step 4 link in DayZeroOnboarding
│       └── marketing/
│           └── page.tsx                  # NEW — operator-only asset kit
└── api/
    └── qr/
        └── [slug]/
            └── route.ts                  # NEW — PNG QR generator

src/components/
├── play/                                 # NEW NAMESPACE
│   ├── PlayHeader.tsx                    # server
│   ├── PlayHero.tsx                      # server; inlines a small <HeroPrimaryCta> client component for the CTA fire event
│   ├── PlayPageView.tsx                  # client; mounts once at top of /play/[slug] to fire play_page_viewed
│   ├── PlayTeeTimePreview.tsx            # server
│   ├── TeeTimeTile.tsx                   # client wrapper for the per-tile click event
│   └── PlayMembershipExplainer.tsx       # server; inlines a small <MembershipCta> client component for the CTA fire event
├── marketing/                            # NEW NAMESPACE
│   └── CourseAssetsKit.tsx
└── home/                                 # NEW NAMESPACE
    └── GolferEscapeBanner.tsx

src/lib/
└── formatTeeTimeLabel.ts                 # NEW — Intl.DateTimeFormat helper for tile labels
```

### Data flow

**`/play/[slug]` (server component, `export const revalidate = 300`):**

- Fetch course: `supabase.from('courses').select('id, name, slug, city, state, timezone, hero_image_url').eq('slug', slug).eq('status', 'active').single()`. If null → `notFound()`.
- Fetch tee times via `fetchNext3Days(supabase, course.id, course.timezone)`:
  - Window: `now` → `now + 3 days` in the course's `timezone` (use `Intl.DateTimeFormat` with `timeZone: course.timezone`, never the server tz).
  - Filter: `course_id = course.id`, `status = 'open'`, `available_players > 0`, `scheduled_at` within window.
  - Sort: `scheduled_at` ASC. Limit: 6.
  - Returns: `{ id, scheduled_at, base_price, special_price, available_players, holes, tee_start }[]`.
- Render `PlayHeader → PlayHero → PlayTeeTimePreview → PlayMembershipExplainer`.

**`/play/[slug]` metadata (`generateMetadata` export):**

- `title`: `{courseName} | Tee Times & Membership · TeeAhead`
- `description`: `Book direct at {courseName}. Save 15% on every round with the TeeAhead pass.`
- OG: static fallback (TeeAhead logo on green) for v1; per-course OG image is deferred.
- If the slug doesn't resolve, `generateMetadata` returns minimal metadata and the page itself handles `notFound()`.

**`/courses` (server component, no explicit revalidate):**

- `supabase.from('courses').select('name, slug, city, state').eq('status', 'active').order('name')`.
- Render as a simple list. Each row links to `/play/${slug}`.

**`/course/[slug]/marketing` (server component, operator-only):**

- `await requireManager(slug)` guard (matches `/install` pattern).
- Fetch `name, slug` for display.
- Pass `baseUrl` (from `process.env.NEXT_PUBLIC_APP_URL`, the project's existing convention used in `src/app/api/auth/logout/route.ts` and `src/app/api/membership/checkout/route.ts`) to `CourseAssetsKit` so qa renders qa URLs and prod renders prod URLs.

**`/api/qr/[slug]` (route handler):**

- Parse `?size=` query param (default `240`, cap `1200`).
- Run `await QRCode.toBuffer(\`${baseUrl}/play/${slug}\`, { width: size, margin: 1 })`.
- Return as `image/png` with `Cache-Control: public, max-age=31536000, immutable`.
- Invalid slug → 404. Generation error → 500.

**Homepage:**

- No new data. Eyebrow is static text inlined in `page.tsx`. `GolferEscapeBanner` is a client component reading dismissal state from `localStorage`.

### Caching summary

| Route | Strategy |
|---|---|
| `/play/[slug]` | ISR via `revalidate: 300` (cache key per slug) |
| `/courses` | Server-rendered per request |
| `/course/[slug]/marketing` | Server-rendered, no cache (behind auth) |
| `/api/qr/[slug]` | `Cache-Control: public, max-age=31536000, immutable` |

## Component specs

### `PlayHeader` (server)

```ts
type Props = { courseName: string, courseSlug: string }
```

- Wrapper: `<header className="flex items-baseline justify-between px-6 py-4 border-b border-[#0F3D2E]/10">`
- Left: TeeAhead wordmark · "/" · `<span className="font-display text-[18px] text-[#0F3D2E]">{courseName}</span>`
- Right: `<Link href="/login" className="text-[13px] text-[#0F3D2E] underline-offset-2 hover:underline">Sign in</Link>`

### `PlayHero` (server, with thin client CTA wrapper)

```ts
type Props = { courseName: string, region: string, courseSlug: string }
```

- Wrapper: `<section className="bg-[#0F3D2E] text-[#F5F1E8] px-6 py-10 sm:py-14">`
- Eyebrow: `font-mono text-[11px] tracking-[0.2em] uppercase opacity-80` → `{courseName} · {region}` (joined with `·`, omits region if empty)
- Headline (two lines, hard `<br />`): `font-display text-[40px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] mt-3` → "Book direct.<br/>Save 15% every round."
- CTA row: `flex flex-col sm:flex-row gap-3 mt-6`
  - Primary `<Link href={\`/join?course=${courseSlug}\`}>` wrapped in a client `<HeroPrimaryCta>` that fires `track('play_pass_cta_clicked', { slug, placement: 'hero' })` → "Get the pass · $89/mo"
  - Secondary anchor `<a href="#tee-times">` → "Book a tee time"

### `PlayTeeTimePreview` (server with `TeeTimeTile` client child)

```ts
type Props = {
  courseSlug: string
  timezone: string
  teeTimes: Array<{
    id: string
    scheduled_at: string
    base_price: number
    special_price: number | null
    holes: number
  }>
}
```

- Section anchor: `<section id="tee-times" className="px-6 mt-10">`
- Header row: `<div className="flex justify-between items-baseline mb-4">` — left `<h2 className="font-mono text-[11px] tracking-[0.15em] text-[#0F3D2E]/60">NEXT 3 DAYS</h2>`, right `<span className="font-mono text-[11px] text-[#0F3D2E]/60">2 PLAYERS · 18 HOLES</span>`
- Grid: `<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">`
- Each tile via `<TeeTimeTile>` (client):
  - `<Link href={\`/book/${slug}?tee_time_id=${id}\`} onClick={() => track('play_tee_time_clicked', { slug, day_offset, price })}>`
  - `border border-[#0F3D2E]/15 p-3 hover:border-[#0F3D2E]/40 transition-colors`
  - Top line: `font-mono text-[11px] text-[#0F3D2E]/60 uppercase` → e.g. "FRI · 2:10P" (from `formatTeeTimeLabel(scheduled_at, timezone)`)
  - Bottom line: `font-display text-[20px] text-[#0F3D2E] mt-1` → `$${special_price ?? base_price}`
- Below grid: `<Link href={\`/book/${slug}\`} className="inline-block mt-4 text-[13px] text-[#0F3D2E] underline-offset-2 hover:underline">See full tee sheet →</Link>`
- Empty state (when `teeTimes.length === 0`): `<div className="border border-[#0F3D2E]/15 p-6 text-[15px] text-[#1A1A1A]/82">No public availability this week. Members get first look — <Link href={\`/join?course=${slug}\`} className="underline">Get the pass →</Link></div>`

### `PlayMembershipExplainer` (server with client CTA wrapper)

```ts
type Props = { courseSlug: string }
```

- Wrapper: `<section className="mt-10 border-t border-[#0F3D2E]/10 pt-8 px-6 pb-12">`
- Eyebrow: `font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase` → "ABOUT THE PASS"
- Bullets (`<ul className="mt-4 space-y-2 text-[15px] text-[#1A1A1A]/82 leading-[1.6]">`):
  1. Save 15% on every round at this course
  2. Free guest passes (Eagle tier)
  3. Early access to weekend tee times
  4. Cancel anytime
- Closing CTA: same styling as hero primary, fires `track('play_pass_cta_clicked', { slug, placement: 'membership_section' })`

### `CourseAssetsKit` (client — clipboard requires browser API)

```ts
type Props = { courseName: string, courseSlug: string, baseUrl: string }
```

Five blocks vertically stacked:

1. **Your golfer page URL:** `<code>{baseUrl}/play/{courseSlug}</code>` + Copy button (clipboard API, 2-second "Copied!" pill confirmation).
2. **QR code:** `<img src={\`/api/qr/${courseSlug}\`} width={200} height={200} alt="QR code for /play/{slug}" />` + Download link `<a href={\`/api/qr/${courseSlug}?size=800\`} download={\`${courseSlug}-qr.png\`}>Download PNG (800×800)</a>`. `onError` on the `<img>` swaps to "QR generation unavailable — refresh to retry".
3. **Instagram bio link copy:** `<textarea readonly>` pre-filled with bio block + Copy button.
4. **Scorecard footer text:** `<textarea readonly>` pre-filled, formatted for print + Copy button.
5. **Email signature HTML snippet:** `<textarea readonly>` HTML block (includes a TeeAhead logo URL) + Copy button.

Exact copy strings for blocks 3–5 are authored during implementation against the TeeAhead voice.

### `GolferEscapeBanner` (client)

- No props.
- On mount, reads `localStorage.getItem('teeahead.golfer-banner-dismissed')`. If `'true'`, renders nothing.
- Otherwise: `<div className="bg-[#0F3D2E]/5 border border-[#0F3D2E]/15 px-4 py-3 text-[13px] text-[#0F3D2E] flex items-center justify-between">`
  - Text: "Looking to play, not run a course? <Link href='/courses' onClick={() => track('homepage_golfer_banner_clicked', { source: 'hole_01' })} className='underline'>See if your course is on TeeAhead →</Link>"
  - Dismiss "×" button writes `'true'` to localStorage and hides the banner; no analytics fire on dismiss.
- `localStorage` access wrapped in try/catch; on failure, banner shows (dismissal becomes per-session).

### `/courses` page

- `<main className="max-w-2xl mx-auto px-6 py-12">`
- Title + a short paragraph at the top: "Courses on TeeAhead" / brief positioning line.
- `<ul className="divide-y divide-[#0F3D2E]/10 mt-6">` — each `<li>` is a `<Link href={\`/play/${slug}\`}>` showing name + `text-[13px]` city/state.

## Analytics

All events via `@vercel/analytics`'s `track()`. Fire-and-forget; never blocks navigation.

| Event | Where | Props |
|---|---|---|
| `play_page_viewed` | `<PlayPageView slug={slug} />` mounted at top of `/play/[slug]`; client component, runs once on mount | `{ slug, referrer: document.referrer, utm_source: searchParams.get('utm_source') ?? null }` |
| `play_pass_cta_clicked` | `PlayHero` primary CTA + `PlayMembershipExplainer` closing CTA | `{ slug, placement: 'hero' \| 'membership_section' }` |
| `play_tee_time_clicked` | `TeeTimeTile` onClick before navigation | `{ slug, day_offset, price }` |
| `homepage_golfer_banner_clicked` | `GolferEscapeBanner` link onClick before navigation | `{ source: 'hole_01' }` |

## Error handling

| Surface | Failure | Behavior |
|---|---|---|
| `/play/[slug]` | Unknown / inactive slug | `notFound()` → Next.js 404 |
| `/play/[slug]` | Supabase query fails | Error propagates → Next.js error boundary; `revalidate: 300` absorbs transients |
| `/play/[slug]` | Zero tee times in window | `PlayTeeTimePreview` empty state; page still renders fully |
| `/play/[slug]` | `course.timezone === null` (shouldn't happen — migration 094 set NOT NULL) | Defensive fallback to `'America/Detroit'` in `fetchNext3Days` |
| `/courses` | Zero active courses | List renders empty; no special empty state in v1 |
| `/course/[slug]/marketing` | Non-manager | `requireManager(slug)` redirects per existing convention |
| `/api/qr/[slug]` | Invalid slug | 404 |
| `/api/qr/[slug]` | `qrcode.toBuffer()` throws | 500; client `<img>` `onError` swaps to inline retry message |
| `GolferEscapeBanner` | `localStorage` unavailable | try/catch → default to showing the banner; dismissal becomes per-session |

## Edge cases worth calling out

- **Timezone correctness** — tile labels are computed via `Intl.DateTimeFormat` with `timeZone: course.timezone`. Server tz is never used.
- **Special pricing** — when `special_price` is set, the tile shows that; `special_label` is *not* surfaced on the tile in v1.
- **Day offset** — `0 | 1 | 2` computed from each tile's calendar date relative to "today in course timezone."
- **`hero_image_url` ignored** — read from the query for future use; not rendered in v1.
- **Day-zero step 4** — added by modifying the inline `DayZeroOnboarding` block in `src/app/course/[slug]/dashboard/page.tsx`. Same step styling as existing steps 1–3. The link is shown regardless of whether the operator has bookings; once `isDayZero` is false the entire block disappears, so this step is only visible during onboarding.
- **QR size param** — `/api/qr/[slug]?size=800` for download, `/api/qr/[slug]` (default 240) for in-page preview.
- **Headline price** — hard-coded "$89/mo" in `PlayHero`. If membership pricing changes, this string must be updated alongside the existing homepage pricing in Hole 06.

## Testing

| Layer | Test | Location |
|---|---|---|
| Vitest unit | `formatTeeTimeLabel(scheduled_at, timezone)` produces correct labels across timezones | `src/test/format-tee-time-label.test.ts` |
| Vitest unit | `PlayTeeTimePreview` empty state renders the membership pitch when `teeTimes=[]` | `src/test/play-tee-time-preview.test.tsx` |
| Vitest unit | `GolferEscapeBanner` hides itself when the localStorage flag is set | `src/test/golfer-escape-banner.test.tsx` |
| Playwright e2e | `/play/[slug]` renders for an active course, 404s for unknown slug, sign-in link goes to login | `tests/e2e/play-page.spec.ts` |
| Playwright e2e | Operator-only `/course/[slug]/marketing` redirects when unauthenticated; shows QR `<img>` when authenticated as manager | `tests/e2e/course-marketing.spec.ts` |

**Intentionally not tested:**
- Vercel Analytics `track()` calls (no harness; spot-check in Vercel dashboard after qa).
- `/api/qr/[slug]` PNG bytes (we test the marketing page renders the `<img>` with the right `src`).
- `/courses` directly (the `/play/[slug]` e2e covers the list → page click path).

## Ship plan

Single long-lived feature branch off `main`: `feat/two-product-site`. After each deliverable lands and tests pass locally, push to `qa` for review on `qa.teeahead.com`. Merge to `main` only when all four are approved.

| # | Deliverable | Files touched | qa review |
|---|---|---|---|
| 1 | Homepage reshape + `/courses` stub (coupled — banner needs a destination) | `src/app/page.tsx`, `src/components/home/GolferEscapeBanner.tsx`, `src/app/courses/page.tsx` | `qa.teeahead.com/` + `qa.teeahead.com/courses` |
| 2 | `/play/[slug]` | `src/app/play/[slug]/page.tsx` + `src/components/play/*` + `src/lib/formatTeeTimeLabel.ts` | `qa.teeahead.com/play/<real-slug>` |
| 3 | `/course/[slug]/marketing` | New route + `src/components/marketing/CourseAssetsKit.tsx` + `src/app/api/qr/[slug]/route.ts` | While authenticated as a manager |
| 4 | Day-zero step 4 link | `src/app/course/[slug]/dashboard/page.tsx` | On a course in day-zero state |

**Per-push verification gate:** `pnpm test`, `pnpm test:e2e`, `pnpm build` locally — only then push to qa. Success is claimed only after eyeball on qa.teeahead.com.

## Open items deferred to follow-ups (not blockers)

- `/auth/sign-in?returnTo=...` support — small fix; ship `/play/[slug]` with bare login link.
- Per-course OG images for `/play/[slug]`.
- Rendering `hero_image_url` as a hero background with overlay.
- Filter selector ("2 players · 18 holes ⌄") on `PlayTeeTimePreview`.
- Average savings line (requires `course_membership_stats` view).
- `content_blocks` migration for homepage and `/play` copy.
- Additional placements of `GolferEscapeBanner` (e.g., persistent footer chip vs Hole 01 only).
