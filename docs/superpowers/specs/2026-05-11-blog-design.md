# Blog Design Spec
**Date:** 2026-05-11
**Status:** Approved

---

## Overview

Build a full blog system at `/blog` for TeeAhead using MDX files. Goal is topical authority and organic search traffic for golf course software and local Metro Detroit golf queries. 17 posts to write alongside the infrastructure.

---

## Architecture

**Storage:** MDX files in `src/content/blog/`. No database. Posts are checked into git alongside code.

**Routes:**
- `/blog` — index page listing all posts with category filter
- `/blog/[slug]` — individual post page

**MDX rendering:** `next-mdx-remote/rsc` (v4+) with `gray-matter` for frontmatter parsing. Chosen over `@next/mdx` because it supports dynamic file loading without requiring webpack config changes, which suits the `/blog/[slug]` pattern. Posts are statically generated at build time (`generateStaticParams`).

---

## Frontmatter Schema

Every MDX file has this frontmatter:

```yaml
---
title: "How Much Does Tee Sheet Software Cost in 2026?"
description: "150-160 char meta description for SEO"
author: neil           # neil | billy
publishedAt: "2026-05-15"
updatedAt: "2026-05-15"
category: courses      # courses | golfers | case-studies
slug: tee-sheet-software-cost
---
```

---

## Blog Index Page — `/blog`

**Layout:** 3-column card grid with category filter pills above.

**Filter pills:** All · For Courses · For Golfers · Case Studies. Filter is client-side (no page reload) — clicking a pill hides non-matching cards via CSS/state.

**Card anatomy:**
- Color band at top (dark green for courses, gold for case studies, warm white for golfers)
- Category label (gold, uppercase, small)
- Post title (bold, dark green)
- Author + reading time (muted, small) — reading time auto-calculated from word count (~200 wpm)

**Page metadata:**
- Title: `Golf Industry Resources | TeeAhead`
- Description: `Guides for golf course operators and Metro Detroit golfers — tee sheet software comparisons, GolfNow alternatives, and local golf resources.`

**Schema:** `CollectionPage` JSON-LD listing all posts.

---

## Individual Post Page — `/blog/[slug]`

**Layout:** Two-column — article (2/3 width) + sticky sidebar (1/3 width).

**Article column:**
- Category + reading time badge (top)
- H1 title
- Author avatar (initials), name, publish date
- Horizontal rule
- MDX content body
- "Written by" card at bottom with author bio snippet

**MDX content supports:**
- Standard headings (H2, H3), paragraphs, lists
- `<Callout>` component — gold left-border highlight box for key stats
- `<ComparisonTable>` component — styled table matching the existing comparison tables on `/tee-time-software`
- `<StatBlock>` component — large-number highlight (e.g. "382%" in a card)

**Sticky sidebar (changes by category):**

| Category | CTA widget | Related links |
|---|---|---|
| courses | Barter calculator link + "Claim a Founding Spot" button | 3 related posts |
| golfers | Membership tier summary + "Join the Waitlist" button | 3 related posts |
| case-studies | Windsor Parke summary card + "Claim a Founding Spot" button | 3 related posts |

Related links are the 3 most recent posts in the same category (excluding current post), resolved at build time. If fewer than 3 exist in the same category, fill remaining slots with the most recent posts from any category.

**Author bio widget:** Shows initials avatar, name, title (Co-Founder, TeeAhead), and 1-sentence bio pulled from a static `AUTHORS` config object in the codebase.

**Page metadata:**
- Title: `{post.title}` (uses root layout template → `{post.title} | TeeAhead`)
- Description: `post.description` from frontmatter
- Canonical: `https://www.teeahead.com/blog/{slug}`
- OG image: `/og-image.png` (shared for now)

**Schema:** `Article` JSON-LD with `author` (Person @id ref), `publisher` (Organization @id ref), `datePublished`, `dateModified`, `headline`, `description`.

**Breadcrumb:** Home → Blog → Post title (BreadcrumbList JSON-LD).

---

## Authors Config

Static object in `src/lib/authors.ts`:

```ts
export const AUTHORS = {
  neil: {
    name: 'Neil Barris',
    title: 'Co-Founder & CEO',
    bio: '10 years in enterprise software. Previously built Outing.golf. Lifelong golfer.',
    schemaId: 'https://www.teeahead.com/#neil-barris',
  },
  billy: {
    name: 'Billy Beslock',
    title: 'Co-Founder & CTO',
    bio: 'Career engineer at Ford Motor Company. The systems thinker behind TeeAhead.',
    schemaId: 'https://www.teeahead.com/#billy-beslock',
  },
}
```

---

## Sitemap

`sitemap.ts` is updated to include all blog posts with `changeFrequency: 'monthly'` and `priority: 0.8`.

---

## Blog Posts — 17 Total

### Industry & Product (10 posts)

| # | Slug | Title | Category | Author |
|---|---|---|---|---|
| 1 | `tee-sheet-software-cost` | How Much Does Tee Sheet Software Cost in 2026? | courses | neil |
| 2 | `golfnow-barter-model-explained` | GolfNow Barter Model Explained: What Golf Courses Actually Pay | courses | neil |
| 3 | `how-to-switch-tee-sheet-software` | How to Switch Tee Sheet Software Without Losing Bookings | courses | billy |
| 4 | `golfnow-vs-foreup-vs-lightspeed-vs-teeahead` | GolfNow vs. foreUP vs. Lightspeed vs. TeeAhead: Full Comparison 2026 | courses | neil |
| 5 | `what-is-a-golf-loyalty-program` | What Is a Golf Loyalty Program and Does It Actually Work? | golfers | neil |
| 6 | `metro-detroit-courses-on-golfnow` | Metro Detroit Golf Courses: What Operators Are Saying About GolfNow in 2026 | courses | neil |
| 7 | `golf-course-revenue-management` | Golf Course Revenue Management: 5 Ways to Stop Leaving Money on the Table | courses | billy |
| 8 | `golfnow-contract-what-to-know` | GolfNow Contract: What to Look For Before You Sign | courses | neil |
| 9 | `how-golf-course-booking-software-works` | How Golf Course Booking Software Works (And What It Should Actually Do) | courses | billy |
| 10 | `windsor-parke-382-percent-revenue-growth` | The Windsor Parke Story: From GolfNow to 382% Revenue Growth | case-studies | neil |

### Michigan & Local SEO (5 posts)

| # | Slug | Title | Category | Author |
|---|---|---|---|---|
| 11 | `best-golf-courses-metro-detroit` | Best Public Golf Courses in Metro Detroit (2026 Guide) | golfers | neil |
| 12 | `michigan-golf-season-guide` | Michigan Golf Season: When to Play, What to Expect, and How to Book | golfers | billy |
| 13 | `michigan-courses-leaving-golfnow` | How Michigan Golf Courses Are Leaving GolfNow (And What They're Switching To) | courses | neil |
| 14 | `golf-leagues-metro-detroit` | Golf Leagues in Metro Detroit: How to Find One, Join One, or Start One | golfers | neil |
| 15 | `tee-time-booking-metro-detroit` | Tee Time Booking in Metro Detroit: Why Local Golfers Are Done With GolfNow Fees | golfers | neil |

### Additional Case Studies (2 posts)

| # | Slug | Title | Category | Author |
|---|---|---|---|---|
| 16 | `missouri-bluffs-revenue-increase` | Missouri Bluffs Golf Club: 36.3% Revenue Increase After Leaving GolfNow | case-studies | neil |
| 17 | `brown-golf-barter-cost` | Brown Golf: How 39.6% of All Rounds Were Costing Them Nothing | case-studies | neil |

> **Note on case studies 16 & 17:** Missouri Bluffs and Brown Golf stats are currently cited from Golf Inc. / NGCOA data, not necessarily direct TeeAhead customers. Frame these as "what happened when [course] left GolfNow" rather than TeeAhead customer stories unless confirmed otherwise.

---

## File Structure

```
src/
  app/
    blog/
      page.tsx              # index — reads all MDX frontmatter, renders grid
      [slug]/
        page.tsx            # individual post — renders MDX + sidebar
  components/
    blog/
      PostCard.tsx          # card used in index grid
      CategoryFilter.tsx    # client component for filter pills
      PostSidebar.tsx       # sticky sidebar with CTA + related posts
      AuthorBio.tsx         # author widget (index avatar + bio card)
      Callout.tsx           # gold highlight box for MDX
      StatBlock.tsx         # large-number highlight for MDX
      ComparisonTable.tsx   # styled table for MDX
  content/
    blog/
      tee-sheet-software-cost.mdx
      golfnow-barter-model-explained.mdx
      ... (17 files total)
  lib/
    authors.ts              # AUTHORS config
    blog.ts                 # getAllPosts(), getPostBySlug() helpers
```

---

## Out of Scope

- Blog search
- Comments
- Newsletter signup (can be added to sidebar later)
- Pagination (17 posts fits on one page)
- Author profile pages
- Tags beyond the 3 categories
