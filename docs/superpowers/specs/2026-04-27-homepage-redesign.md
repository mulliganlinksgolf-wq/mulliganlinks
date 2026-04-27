# Homepage Redesign — Design Spec

**Date:** 2026-04-27
**Approach:** B — Story Arc
**Status:** Approved by user

---

## Goals

Make the homepage say "wow" to two equal audiences:
- **Course owners** evaluating whether TeeAhead is a credible partner
- **Metro Detroit golfers** who are frustrated with GolfNow and landing here for the first time

The page must earn trust from owners while making golfers feel like this was built for them.

---

## Design Direction

**Premium Local** — dark green + gold, Playfair Display serif headlines, editorial spacing. Confident, not corporate. The kind of thing a course owner would show their board.

---

## Typography

| Role | Font | Weight |
|---|---|---|
| Display headlines, stat numbers | Playfair Display | 700–900 |
| Body, UI, labels | Inter | 400–700 |
| Founder letter only | Caveat | 400–700 (already in codebase) |

Add `Playfair Display` via `next/font/google` in `layout.tsx`. Expose as a CSS variable (e.g. `--font-display`) alongside the existing `--font-sans`.

---

## Color Palette

No changes to the existing palette. All current color tokens remain:

| Token | Value | Use |
|---|---|---|
| Primary green | `#0F3D2E` | Nav, hero overlay, solution section, letter section bg |
| Deep green | `#1B4332` | Ace pricing card accent |
| Gold | `#E0A800` | Course card, featured pricing badge, manifesto italic |
| Cream | `#F4F1EA` | Text on dark, golfer CTA button |
| Warm off-white | `#FAF7F2` | Pricing section bg, proof strip |
| White | `#FFFFFF` | Stat moment section bg |
| Dark footer | `#071f17` | Footer bg (slightly darker than current `#0F3D2E`) |
| Body text | `#1A1A1A` | Headings on light bg |
| Muted text | `#6B7770` | Subtext, labels |
| Subtle text | `#9DAA9F` | Eyebrows, sources, footnotes |

---

## Page Structure

8 sections total (Nav + 6 content sections + Footer), down from 10. Sections removed: "How It Works", "Founder Bios", "vs. GolfNow comparison table". Content from removed sections is absorbed into the remaining sections.

### Section 1 — Nav

- **Background:** `#0F3D2E` (changed from current cream — flows seamlessly into hero)
- **Logo:** existing `TeeAheadLogo` component, rendered white via `brightness-0 invert` class
- **Links:** add "Barter Calculator" as a text nav link (Inter 14px, `rgba(244,241,234,0.70)`, hover → white) before the CTA button
- **CTA button:** gold (`#E0A800`), dark text, replaces current green button
- **Sticky behavior:** unchanged

### Section 2 — Hero

- **Background:** golf photo (current Unsplash URL, unchanged) with dark green overlay (`rgba(8,36,25,0.88)→rgba(15,61,46,0.82)` gradient) + radial vignette
- **Badge:** pill with gold dot pulse animation, gold border — "Coming soon · Metro Detroit"
- **Headline:** Playfair Display 900, ~58px, `#F4F1EA` — *"Golf, returned to the people who actually play it."* (italic on "actually", gold color)
- **Subhead:** Inter 400, 17px, `rgba(244,241,234,0.72)` — short, 2 lines max
- **Audience cards:** 2-column grid, max-width 620px, centered
  - **Golfer card:** `rgba(244,241,234,0.10)` bg, `rgba(244,241,234,0.22)` border, backdrop-blur. Title: cream. CTA: cream button, dark green text ("Join the Waitlist"). Sub-label: "Free · No credit card"
  - **Course card:** `rgba(224,168,0,0.12)` bg, `rgba(224,168,0,0.50)` border, backdrop-blur. Title: gold. CTA: gold button, near-black text ("Claim a Founding Spot"). Sub-label: "X of 10 spots remaining" (dynamic from DB)
- **Remove:** current long SEO paragraph in the hero (move to page metadata only)

### Section 3 — Stat Moment

- **Background:** white (`#FFFFFF`), gold top border (4px, `#E0A800`)
- **Eyebrow:** Inter 700, 11px, tracked uppercase, `#9DAA9F` — "What GolfNow costs the average course, per year"
- **Number:** Playfair Display 900, 96px, `#0F3D2E` — `$94,500`
- **Label:** Inter 500, 20px, `#1A1A1A` — "in barter tee times — revenue taken directly out of your pocket"
- **Supporting copy:** 15px, `#6B7770` — Brown Golf / Windsor Parke context, 2 sentences max
- **Contrast line:** `#6B7770` with `#0F3D2E` bold — "TeeAhead charges $0. For Founding Partners, forever."
- **Barter CTA:** a distinct callout row below the contrast line — dark green bg pill or card, copy: "Want your exact number? Use the barter calculator →", links to `/barter`. This is a key conversion point for course owners and should be visually distinct, not just an inline text link.

**Proof strip** (immediately below, cream bg `#FAF7F2`):
- 3 items inline: `100+` courses left GolfNow · `382%` revenue increase at Windsor Parke · `$0` TeeAhead charges
- Numbers: Playfair Display 800, 32px, `#0F3D2E`
- Labels: Inter 12px, `#6B7770`

### Section 4 — Solution

- **Background:** `#0F3D2E`
- **Headline:** Playfair Display 800, 42px, `#F4F1EA` — "The better way to play — and to run a course."
- **Subhead:** Inter 400, 16px, `rgba(244,241,234,0.60)` — 1–2 lines
- **Layout:** 2-column card grid, max-width 760px
  - **Golfer card:** `rgba(244,241,234,0.07)` bg, `rgba(244,241,234,0.12)` border, 5 feature bullets, cream CTA button
  - **Course card:** `rgba(224,168,0,0.10)` bg, `rgba(224,168,0,0.30)` border, gold check marks, 5 feature bullets, gold CTA button
- **Replaces:** current "For Golfers / For Courses" two-column section + "How It Works" section

### Section 5 — Pricing

- **Background:** `#FAF7F2`
- **Eyebrow:** "Membership"
- **Headline:** Playfair Display 800 — "Pick your game."
- **Cards:** 3-column grid, Eagle featured card lifts 8px with gold ring + gold "Most Popular" badge
  - Fairway: white card, outline green button
  - Eagle: white card, 2px gold border, filled dark green button, gold check marks
  - Ace: white card, 2px `#1B4332` border, outline dark green button, dark green check marks
- **Pricing data:** unchanged (Fairway $0, Eagle $79/yr, Ace $149/yr)
- **Remove:** vs. GolfNow comparison table (the stat moment + solution section makes the case more compellingly; barter calculator handles the detailed comparison for motivated course owners)
- **Keep:** footnote copy about upgrade behavior

### Section 6 — Founder Letter

- **Background:** `#0F3D2E`
- **Eyebrow:** Inter 700 tracked uppercase, `rgba(244,241,234,0.35)` — "A note from the founders"
- **Letter card:** unchanged from current implementation (Caveat font, ruled lines, red margin line, slight rotation, heavy shadow)
- **Remove:** separate founder bio section with avatar circles (the letter is the founder section)

### Section 7 — Manifesto

- **Background:** `#0F3D2E`, top border `rgba(244,241,234,0.08)`
- **Text:** Playfair Display 900, fluid sizing (clamp 36px→72px), `#F4F1EA` — *"Local golf, returned to the people who actually play it."* (italic "actually" in gold `#E0A800`)
- **Add dual CTAs below the manifesto text** (currently missing — the section is a dead end):
  - Primary: cream button — "⛳ Join the Golfer Waitlist"
  - Secondary: ghost button — "Claim a Founding Course Spot →"

### Section 8 — Footer

- **Background:** `#071f17` (slightly darker than body green — creates visual closure)
- **Logo:** existing `TeeAheadLogo` with `brightness-0 invert`
- **Structure:** unchanged 3-column grid
- **Remove:** legal disclaimer paragraph (keep it in `/terms` and `/privacy` — it clutters the footer)

---

## Sections Removed

| Section | Reason |
|---|---|
| How It Works (3-step cards) | Redundant — the page already demonstrates it through structure |
| Founder Bios (avatar circles) | Replaced entirely by the founder letter, which is more compelling |
| vs. GolfNow comparison table | The $94,500 stat moment makes the case more powerfully; barter calculator link preserved |

---

## Animations

- Keep existing `FadeIn` component on all sections
- Hero badge: CSS pulse animation on the dot (already in mockup)
- Audience cards: `translateY(-2px)` on hover with `transition: 0.15s ease`
- No other new animations — let the typography and spacing do the work

---

## What Does NOT Change

- All copy/content (headlines, body text, stats, legal footnotes) — unchanged unless noted
- Supabase data fetching (founding partner counter, content blocks)
- Waitlist links and routing
- `/barter` page itself — untouched, only the homepage links to it more prominently
- Founder letter content and Caveat font implementation
- SEO metadata, structured data, sitemap
- Mobile responsiveness approach (Tailwind breakpoints)

---

## Files Affected

- `src/app/layout.tsx` — add Playfair Display font
- `src/app/page.tsx` — primary file, all section changes
- `src/app/globals.css` — add `--font-display` CSS variable if needed
- No new components required — changes are all in `page.tsx` and `layout.tsx`
