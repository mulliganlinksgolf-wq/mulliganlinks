# GEO Audit Report: TeeAhead

**Audit Date:** April 30, 2026
**URL:** https://www.teeahead.com
**Business Type:** SaaS + Consumer Marketplace (Golf Tee Time Booking / Loyalty)
**Pages Analyzed:** 9 (8 in sitemap + /damage)

---

## Executive Summary

**Overall GEO Score: 42/100 — Poor**

TeeAhead has genuinely strong content — specific statistics, named case studies, and a clear competitive angle against GolfNow — but that content is currently invisible to AI systems due to three compounding problems: active pricing errors in structured data and llms.txt that cause AI models to cite wrong prices, a canonical tag bug that tells search engines six of eight pages are duplicates of the homepage, and zero external brand presence that AI models can use to verify TeeAhead is a real entity. The site is technically clean (SSR, no crawler blocks, HTTPS) and the content quality is above average for a pre-launch startup. The GEO gap is almost entirely fixable in the next 30 days.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 52/100 | 25% | 13.0 |
| Brand Authority | 5/100 | 20% | 1.0 |
| Content E-E-A-T | 52/100 | 20% | 10.4 |
| Technical GEO | 62/100 | 15% | 9.3 |
| Schema & Structured Data | 38/100 | 10% | 3.8 |
| Platform Optimization | 46/100 | 10% | 4.6 |
| **Overall GEO Score** | | | **42/100** |

---

## Critical Issues (Fix Immediately)

### 1. Pricing errors in structured data and llms.txt are actively misleading AI systems

Three separate sources disagree on TeeAhead's pricing:

| Source | Eagle | Ace | Course |
|---|---|---|---|
| Live website (correct) | $89/yr | $159/yr | $349/mo |
| JSON-LD SoftwareApplication schema | **$79/yr** ❌ | **$149/yr** ❌ | — |
| llms.txt | **$79/yr** ❌ | **$149/yr** ❌ | **$249/mo** ❌ |

Every AI model that reads the schema or llms.txt will confidently tell prospective customers wrong prices. This is an active trust and conversion problem.

**Fix:** Update `SoftwareApplication` offer prices in `StructuredData.tsx` (Eagle: `"89"`, Ace: `"159"`, Course: `"349"`) and rewrite `llms.txt` entirely (see Medium Priority for full spec).

### 2. Canonical tag bug: 6 of 8 pages self-identify as duplicates of the homepage

The following pages have their canonical tag incorrectly set to `https://www.teeahead.com` instead of their own URL:

- `/barter` → canonical points to `/`
- `/contact` → canonical points to `/`
- `/waitlist/golfer` → canonical points to `/`
- `/waitlist/course` → canonical points to `/`
- `/damage` → canonical points to `/`

(Only `/` and `/golfnow-alternative` have correct self-referencing canonicals.)

This instructs Google and AI crawlers to treat these pages as duplicates of the homepage, effectively deindexing them as standalone resources. `/barter` and `/damage` — the two highest-value GEO pages — are invisible to AI citation as a result.

**Fix:** Add `alternates: { canonical: '/page-slug' }` to each page's `metadata` export in Next.js. Remove any hardcoded canonical from the root layout.

```typescript
// app/barter/page.tsx
export const metadata: Metadata = {
  alternates: { canonical: '/barter' },
}
// repeat for /contact, /waitlist/golfer, /waitlist/course, /damage
```

### 3. `/damage` is missing from sitemap.xml

The `/damage` page is live, linked from the homepage and `/golfnow-alternative`, and contains TeeAhead's most statistically dense content (interactive GolfNow damage calculator). It is absent from `sitemap.ts`. AI crawlers that use sitemaps for discovery priority will deprioritize or miss it entirely.

**Fix:** Add `/damage` to `sitemap.ts`. Also note: the calculator outputs are JavaScript-rendered and invisible to crawlers — add static fallback text describing representative outputs (e.g., "A course with a $75 average green fee, open 270 days/year, running 2 barter tee times/day for 5 years has lost approximately $202,500 to GolfNow").

---

## High Priority Issues

### 4. `sameAs` array in Organization schema is an empty array

The Organization schema declares `"sameAs": []`. This is worse than omitting the property — it explicitly signals to AI models that TeeAhead has no verified cross-platform identity. AI systems cannot confirm TeeAhead is a real operating company beyond its own domain.

**Fix:** Create a LinkedIn company page and Crunchbase profile (10 minutes each), then populate `sameAs` in `StructuredData.tsx`:

```json
"sameAs": [
  "https://www.linkedin.com/company/teeahead",
  "https://www.crunchbase.com/organization/teeahead"
]
```

### 5. No Person schemas for Neil Barris or Billy Beslock

Neither founder has a `Person` schema node. AI models have no structured way to attribute content to credentialed people or verify who is behind TeeAhead.

**Fix:** Add Person schemas for both founders to the site-wide `@graph` (full templates in Schema section below).

### 6. No Article schema on `/golfnow-alternative`

The `/golfnow-alternative` page is 1,100+ words with sourced statistics, named case studies, and comparison tables — the site's highest-citability content. It has no `Article` schema, no author attribution, and no `datePublished`. Without these, AI models have no content identity signal to cite.

**Fix:** Add `Article` schema to `/golfnow-alternative` only (template in Schema section below), with `author` referencing Neil Barris's Person @id.

### 7. FAQPage schema deployed on pages with no FAQ content

The identical FAQPage JSON-LD block is served on every page including `/barter`, `/damage`, `/waitlist/golfer`, `/waitlist/course`, and `/contact` — none of which have visible FAQ sections. This is a schema validity violation that can trigger manual review actions.

**Fix:** Scope FAQPage schema to the homepage only (where the "Common questions" section exists). Remove it from all other pages.

### 8. Duplicate "TeeAhead | TeeAhead" title suffix on 4 pages

`/barter`, `/waitlist/golfer`, `/waitlist/course`, and `/damage` all have titles ending with "TeeAhead | TeeAhead" — the brand name appended twice. This is a `title.template` misconfiguration.

**Fix:**
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | TeeAhead',
    default: 'TeeAhead | Free Golf Tee Time Booking & Loyalty — Metro Detroit',
  },
}

// Each page — omit "TeeAhead" from the page-level title string
// app/barter/page.tsx
export const metadata: Metadata = {
  title: 'Barter Calculator: What GolfNow Costs Your Course',
}
```

### 9. Meta descriptions missing or out-of-spec on multiple pages

| Page | Issue |
|---|---|
| Homepage | Present but 192 chars (limit 160) — will be truncated |
| /golfnow-alternative | Present but 180 chars — will be truncated |
| /waitlist/course | Only 74 chars — Google will auto-generate |
| /waitlist/golfer | Only 91 chars — Google will auto-generate |
| /contact | Only 107 chars — Google will auto-generate |
| /damage | Present but 170 chars — will be truncated |

**Fix:** Trim long descriptions to 150-160 chars. Expand short ones to 140-160 chars with a specific value proposition.

### 10. Open Graph `og:url` points to homepage on all non-homepage pages

`/golfnow-alternative`, `/barter`, `/contact`, and `/damage` all have `og:url` set to `https://www.teeahead.com`. When these pages are cited by AI systems or shared socially, the wrong canonical URL is reported.

**Fix:** Set page-specific `og:url` in each page's `metadata` export using Next.js `metadataBase`.

### 11. Security headers missing

CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are all absent. These affect trust signals for enterprise buyers (course GMs) and some AI search quality signals.

**Fix in `next.config.js`:**
```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
}
```

---

## Medium Priority Issues

### 12. llms.txt is malformed and inaccurate

The current file at `/llms.txt` contains a single prose paragraph with stale prices and no structure. Against the llms.txt specification:

- ❌ No `# TeeAhead` H1 header
- ❌ Eagle $79/yr (wrong — should be $89)
- ❌ Ace $149/yr (wrong — should be $159)
- ❌ No section structure (H2 headings)
- ❌ No markdown links to any page
- ❌ No `/llms-full.txt` companion file

**Fix — replace `/llms.txt` entirely:**

```markdown
# TeeAhead

TeeAhead is Metro Detroit's commission-free golf tee time booking platform. Free tee sheet software for golf courses (zero barter tee times, zero commissions). Loyalty memberships for golfers starting at $89/yr — cheaper than GolfPass+.

## For Golfers

- [Golfer Waitlist](https://www.teeahead.com/waitlist/golfer): Join the waitlist for Metro Detroit launch
- [Membership Tiers](https://www.teeahead.com/waitlist/golfer): Fairway (free), Eagle ($89/yr), Ace ($159/yr)
- Eagle includes 250 bonus Fairway Points, 1 complimentary round/yr, zero booking fees, 2x points, 48hr priority booking, 1 guest pass/yr
- Ace includes 500 bonus points, 2 complimentary rounds/yr, 3x points, 72hr priority booking, 2 guest passes/yr

## For Golf Courses

- [Founding Partner Application](https://www.teeahead.com/waitlist/course): First 10 courses get first year free
- After year one: $349/month flat, no long-term contract
- Includes: live tee sheet, booking engine, loyalty system, analytics, waitlist management, integrated payments
- Zero barter tee times — courses keep 100% of their tee times and all golfer data

## GolfNow Comparison

- [GolfNow Alternative](https://www.teeahead.com/golfnow-alternative): Full comparison for courses and golfers
- [Barter Calculator](https://www.teeahead.com/barter): See what GolfNow barter costs your course
- [Damage Report](https://www.teeahead.com/damage): Calculate total historical GolfNow barter cost

## Company

Founded: 2026
Location: Metro Detroit, Michigan
Founders: Neil Barris (neil@teeahead.com), Billy Beslock (billy@teeahead.com)
Support: support@teeahead.com
```

### 13. No About page — biggest single E-E-A-T gap

`/about` returns a 404. There is nowhere to build organizational authority. The founder bio information (Neil's Outing.golf history, Billy's perspective as a golfer) exists only as a 40-word FAQ answer.

**Fix:** Create `/about` with 500-800 word bios for both founders, their relevant experience, what they learned, and why they built TeeAhead. Add Person schema. This is the single highest-impact E-E-A-T page you can add.

### 14. No external citations hyperlinked on content pages

NGCOA, Golf Inc., Windsor Parke Golf Club, and Missouri Bluffs Golf Club are cited by name on `/golfnow-alternative` and `/barter` — but no outbound links point to the actual sources. AI models cannot verify the evidence chain.

**Fix:** Hyperlink NGCOA and Golf Inc. citations to their actual publications. If the Windsor Parke case study has a Golf Inc. article URL, link it. Transparent sourcing is a direct Trustworthiness signal.

### 15. No author byline on `/golfnow-alternative`

This is TeeAhead's most citation-worthy page. No author is attributed. ChatGPT and Google Gemini both weight pages with named, credentialed authors significantly higher.

**Fix:** Add a byline below the H1:
> *Written by Neil Barris, co-founder of TeeAhead. Neil previously built Outing.golf, a golf group booking platform serving metro Detroit courses.*

Also add `datePublished` and `dateModified` as visible text.

### 16. Bing Webmaster Tools not verified

No `msvalidate.01` meta tag in `layout.tsx`. Bing Copilot entity attribution requires Bing index control.

**Fix:** Add Bing Webmaster Tools verification alongside the existing Google verification in `layout.tsx`:
```typescript
verification: {
  google: 'UMxgTah2fiIao60gzONoz4OVsdiAu7LUxat6FO_5-a8',
  other: { 'msvalidate.01': '[YOUR_BING_VERIFICATION_CODE]' },
}
```

### 17. Homepage FAQ is JavaScript-rendered only

The "Common questions" accordion on the homepage is a `'use client'` component. FAQ answers exist in `FAQPage` JSON-LD (good), but Google AI Overviews prefers extracting from visible server-rendered HTML, not just schema.

**Fix:** Convert to a CSS-toggle accordion (no client JS needed) so answers exist in the initial HTML payload.

### 18. Non-www HTTPS version serves 200 instead of redirecting

Both `https://teeahead.com` and `https://www.teeahead.com` return HTTP 200. Canonicals handle the SEO signal, but a 301 redirect is cleaner and eliminates any ambiguity for AI crawlers.

**Fix:** Add a redirect in `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "teeahead.com" }],
      "destination": "https://www.teeahead.com/:path*",
      "permanent": true
    }
  ]
}
```

---

## Low Priority Issues

### 19. Sitemap `lastmod` timestamps are all identical

Every sitemap entry has the same `lastmod` value — a build-time timestamp applied uniformly. When all URLs share the same modification date, crawlers discount the freshness signal entirely.

**Fix:** Track per-page `lastModified` dates and surface them in `sitemap.ts`.

### 20. No `Content-Signal:` directive in robots.txt

The emerging IETF draft `content-signals` allows explicit AI retrieval permissions.

**Fix:** Add to `robots.txt`:
```
Content-Signal: ai-retrieval=yes, search=yes, ai-train=no
```

### 21. No Supabase preconnect hint

The site fetches from Supabase for form submissions. A preconnect hint reduces connection latency.

**Fix:** Add to `<head>`: `<link rel="preconnect" href="https://raqarpvbcdpgojcrmpyh.supabase.co">`

### 22. Zero community/platform footprint

TeeAhead has no Reddit presence, no YouTube channel, no LinkedIn company page, no Crunchbase listing, no trade press coverage. Perplexity AI sources heavily from Reddit. ChatGPT and Gemini use sameAs platform links for entity resolution.

**Fix (30-day effort):**
- Create LinkedIn company page (10 min — highest priority)
- Create Crunchbase organization listing (10 min)
- Post value-first Reddit thread in r/golf linking the /barter calculator
- Target one trade press mention (Golf Inc., NGCOA newsletter, Crain's Detroit Business)

---

## Category Deep Dives

### AI Citability (52/100)

**Strongest blocks on the site:**

| Content Block | Citability Score | Notes |
|---|---|---|
| Windsor Parke 382% revenue increase ($81K → $393K) | 79/100 | Named course, before/after dollars, causal claim — citation-ready |
| GolfNow $94,500/yr barter cost calculation | 68/100 | Specific dollar amount, daily/annual breakdown — near citation-ready |
| Pricing table (Fairway/Eagle/Ace) | 68/100 | Self-contained, table format ideal for AI parsing |
| "100+ courses left GolfNow in Q1 2025" stat | 67/100 | Hard number, time-bound quarter |
| Brown Golf 39.6% barter-round data | 65/100 | Named company, percentage, multi-year — specific and distinctive |

**Weakest (score < 20):**
- Homepage H1: "Golf, returned to the people who actually play it." — 12/100 (poetic brand line, zero factual content)
- `/damage` interactive calculator outputs — uncrawlable (JavaScript-rendered values)
- Contact page taglines — 8/100

**Structural penalties depressing the score:**
- No FAQ markup using question-answer pattern on content pages
- Zero schema on `/barter` and `/damage`
- No meta descriptions serving as AI-readable page summaries on key pages

### Brand Authority (5/100)

| Platform | Status |
|---|---|
| Wikipedia | Absent — not possible yet (notability policy) |
| Reddit | Absent — no indexed mentions in any subreddit |
| YouTube | Absent — no channel or brand mentions |
| LinkedIn | Absent — no company page |
| Crunchbase | Absent |
| Trade press (Golf Inc., NGCOA, Golf Digest) | Absent |
| G2 / Capterra / Trustpilot | Absent |
| Local news (Crain's Detroit) | Absent |

This is the single largest drag on the GEO score and is structural — brand authority accrues over time. The 5/100 reflects the domain itself being indexed. **Target: one named trade press mention within 60 days of launch.**

### Content E-E-A-T (52/100)

| Pillar | Score | Key Finding |
|---|---|---|
| Experience | 14/25 | Strong borrowed evidence (Windsor Parke, Missouri Bluffs, Brown Golf data) but no TeeAhead operational results yet — unavoidable pre-launch |
| Expertise | 11/25 | Founders named with relevant backgrounds, industry terminology accurate, barter math transparent — but no bylines, no bio page, no linked credentials |
| Authoritativeness | 8/25 | Weakest pillar — zero third-party validation, no About page, empty sameAs, no industry directory presence |
| Trustworthiness | 19/25 | Best pillar — detailed Privacy Policy, transparent pricing, direct founder emails, competitor disclaimers, NGCOA citations attributed by name |

The site reads with genuine conviction and specificity. Content avoids AI-generic phrases and maintains a consistent opinionated voice throughout. The Trustworthiness score is meaningfully above average for a 2026 startup.

### Technical GEO (62/100)

**Passes:**
- Next.js SSR — all content visible without JavaScript execution ✓
- HTTPS active, HTTP → HTTPS 308 redirect ✓
- Mobile optimized (viewport meta, responsive images via Next.js Image) ✓
- robots.txt present, all AI crawlers allowed ✓
- Google Search Console verified ✓
- Async scripts, no render-blocking resources ✓

**Fails:**
- Canonical bug: 6 pages canonicalize to homepage ❌ (critical)
- Price errors in JSON-LD and llms.txt ❌ (critical)
- `/damage` missing from sitemap ❌
- Duplicate title suffix on 4 pages ❌
- `og:url` wrong on all interior pages ❌
- Security headers absent (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) ❌
- Uniform sitemap `lastmod` timestamps ❌
- Bing Webmaster Tools not verified ❌

### Schema & Structured Data (38/100)

**Detected (server-rendered JSON-LD, correct format):**
- Organization, WebSite, SoftwareApplication, FAQPage — present site-wide

**Critical errors:**
- `sameAs: []` — explicitly empty, signals no verified identity
- Eagle price `"79"` in schema (should be `"89"`)
- Ace price `"149"` in schema (should be `"159"`)
- FAQPage on 6 pages with no visible FAQ content (validity violation)

**Missing entirely:**
- Person schema (Neil Barris, Billy Beslock)
- Article schema on `/golfnow-alternative`
- `speakable` property on any page
- BreadcrumbList
- `legalName`, `email`, `address` in Organization

### Platform Optimization (46/100)

| Platform | Score | Top Gap |
|---|---|---|
| Google AI Overviews | 54/100 | FAQ accordion is JS-only; price mismatch in schema; no definition paragraph |
| Google Gemini | 50/100 | Empty sameAs blocks Knowledge Graph; no Person schema |
| Bing Copilot | 46/100 | No LinkedIn (Microsoft ecosystem); Bing not verified; no IndexNow |
| Perplexity AI | 42/100 | Zero Reddit/community presence; /damage not in sitemap; no visible dates |
| ChatGPT Web Search | 38/100 | No Wikipedia/Wikidata; empty sameAs; no author bylines; llms.txt price errors |

---

## Quick Wins (Implement This Week)

1. **Fix prices in `StructuredData.tsx`** — Eagle `"89"`, Ace `"159"`, Course `"349"` — 15 min, fixes AI citation accuracy across Google AIO, ChatGPT, Bing Copilot simultaneously
2. **Fix canonical tags on 6 pages** — Add `alternates: { canonical: '/page-slug' }` to each page's metadata — 30 min, unblocks independent indexing of /barter and /damage
3. **Add `/damage` to `sitemap.ts`** — 5 min, makes the site's most unique page discoverable by all crawlers
4. **Rewrite `llms.txt`** with correct prices, H1 header, H2 sections, and links to all key pages — 20 min, fixes ChatGPT/Claude context accuracy
5. **Fix "TeeAhead | TeeAhead" duplicate title suffix** — Update `title.template` in layout.tsx — 10 min
6. **Create LinkedIn company page + Crunchbase profile** — 20 min, enables sameAs population, unblocks entity recognition on 3 platforms
7. **Remove FAQPage schema from non-FAQ pages** — 15 min, fixes schema validity violation

---

## 30-Day Action Plan

### Week 1: Fix Active Errors
- [ ] Fix Eagle/Ace prices in `StructuredData.tsx` ($79→$89, $149→$159, $249→$349)
- [ ] Fix canonical tags on `/barter`, `/contact`, `/waitlist/golfer`, `/waitlist/course`, `/damage`
- [ ] Add `/damage` to `sitemap.ts`
- [ ] Rewrite `llms.txt` to spec (see template above)
- [ ] Fix duplicate "TeeAhead | TeeAhead" title suffixes
- [ ] Remove FAQPage schema from non-FAQ pages
- [ ] Fix `og:url` on all interior pages

### Week 2: Structured Data + Identity
- [ ] Create LinkedIn company page for TeeAhead
- [ ] Create Crunchbase organization listing
- [ ] Populate `sameAs` in Organization schema with LinkedIn + Crunchbase URLs
- [ ] Add Person schemas for Neil Barris and Billy Beslock to `@graph`
- [ ] Add Article schema to `/golfnow-alternative`
- [ ] Add `speakable` property to Article schema and homepage

### Week 3: Content + Authority
- [ ] Build `/about` page — 500-800 word founder bios, Person schema, linked credentials
- [ ] Add author byline + `datePublished` to `/golfnow-alternative`
- [ ] Add visible "Last updated: [date]" to `/barter` and `/damage`
- [ ] Hyperlink NGCOA and Golf Inc. citations on content pages
- [ ] Add static fallback content to `/damage` describing representative calculator outputs
- [ ] Post value-first Reddit thread in r/golf linking the /barter calculator

### Week 4: Technical Polish + Distribution
- [ ] Add Bing Webmaster Tools verification (`msvalidate.01`)
- [ ] Add security headers via `next.config.js`
- [ ] Convert homepage FAQ accordion from JS state to CSS toggle
- [ ] Configure non-www → www 301 redirect in `vercel.json`
- [ ] Fix per-page `lastmod` in `sitemap.ts`
- [ ] Add `Content-Signal:` directive to `robots.txt`
- [ ] Begin outreach: one trade press pitch (Golf Inc. or NGCOA newsletter)

---

## Appendix: Pages Analyzed

| URL | Title | Key Issues |
|---|---|---|
| https://www.teeahead.com | TeeAhead \| Free Golf Tee Time Booking & Loyalty App — Metro Detroit | Meta desc too long (192 chars); title too long (67 chars) |
| https://www.teeahead.com/golfnow-alternative | Best GolfNow Alternative for Courses & Golfers \| TeeAhead | Meta desc too long (180 chars); no Article schema; no author byline; no datePublished; logo missing alt text |
| https://www.teeahead.com/barter | Barter Calculator: What GolfNow Costs Your Course — TeeAhead \| TeeAhead | Duplicate title suffix; canonical → homepage; no schema; meta desc short (112 chars) |
| https://www.teeahead.com/contact | For Courses \| TeeAhead | Title too short/vague (22 chars); canonical → homepage; no schema; meta desc short (107 chars) |
| https://www.teeahead.com/waitlist/golfer | Join the Golfer Waitlist — TeeAhead \| TeeAhead | Duplicate title suffix; canonical → homepage; no schema; meta desc short (91 chars) |
| https://www.teeahead.com/waitlist/course | Founding Partner Application — TeeAhead \| TeeAhead | Duplicate title suffix; canonical → homepage; no schema; meta desc short (74 chars) |
| https://www.teeahead.com/damage | GolfNow Damage Report — What Has GolfNow Cost Your Course? \| TeeAhead | **NOT IN SITEMAP**; duplicate title suffix; canonical → homepage; meta desc too long (170 chars); calculator outputs uncrawlable |
| https://www.teeahead.com/terms | Terms of Service \| TeeAhead | No critical GEO issues |
| https://www.teeahead.com/privacy | Privacy Policy \| TeeAhead | No critical GEO issues |

---

## Schema Templates — Copy-Paste Ready

### Homepage @graph (full replacement)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.teeahead.com/#organization",
      "name": "TeeAhead",
      "legalName": "TeeAhead, LLC",
      "url": "https://www.teeahead.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.teeahead.com/logo.png",
        "width": 200,
        "height": 60
      },
      "description": "Free tee sheet software for golf courses with a loyalty membership program for golfers. Zero barter tee times, zero commissions. Metro Detroit launch, 2026.",
      "foundingDate": "2026",
      "email": "support@teeahead.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Detroit",
        "addressRegion": "MI",
        "addressCountry": "US"
      },
      "areaServed": { "@type": "Place", "name": "Metro Detroit, Michigan" },
      "founder": [
        { "@id": "https://www.teeahead.com/#neil-barris" },
        { "@id": "https://www.teeahead.com/#billy-beslock" }
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@teeahead.com",
        "contactType": "customer support",
        "availableLanguage": "English"
      },
      "sameAs": [
        "https://www.linkedin.com/company/teeahead",
        "https://www.crunchbase.com/organization/teeahead"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://www.teeahead.com/#neil-barris",
      "name": "Neil Barris",
      "email": "neil@teeahead.com",
      "jobTitle": "Co-Founder",
      "worksFor": { "@id": "https://www.teeahead.com/#organization" },
      "description": "Co-founder of TeeAhead. Previously built Outing.golf. Based in Metro Detroit.",
      "sameAs": ["[Neil LinkedIn URL]"],
      "knowsAbout": ["Golf course management software", "Tee time booking systems", "Golf loyalty programs"]
    },
    {
      "@type": "Person",
      "@id": "https://www.teeahead.com/#billy-beslock",
      "name": "Billy Beslock",
      "email": "billy@teeahead.com",
      "jobTitle": "Co-Founder",
      "worksFor": { "@id": "https://www.teeahead.com/#organization" },
      "description": "Co-founder of TeeAhead. Metro Detroit golfer and product thinker behind the TeeAhead membership model.",
      "sameAs": ["[Billy LinkedIn URL]"],
      "knowsAbout": ["Golf membership programs", "Golf loyalty programs"]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.teeahead.com/#website",
      "url": "https://www.teeahead.com",
      "name": "TeeAhead",
      "publisher": { "@id": "https://www.teeahead.com/#organization" }
    },
    {
      "@type": "SoftwareApplication",
      "name": "TeeAhead",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Web",
      "url": "https://www.teeahead.com",
      "description": "Golf tee time booking and loyalty platform for Metro Detroit. Free tee sheet software for partner courses. Eagle membership ($89/yr) beats GolfPass+ on price and benefits.",
      "publisher": { "@id": "https://www.teeahead.com/#organization" },
      "featureList": [
        "Online tee time booking",
        "Fairway Points loyalty program",
        "Zero booking fees for golfers",
        "Zero barter tee times for courses",
        "Zero commissions on bookings",
        "Priority booking windows",
        "Guest passes",
        "Course-owned golfer data"
      ],
      "offers": [
        {
          "@type": "Offer",
          "name": "Fairway",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://www.teeahead.com/waitlist/golfer"
        },
        {
          "@type": "Offer",
          "name": "Eagle Membership",
          "price": "89",
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "89",
            "priceCurrency": "USD",
            "unitCode": "ANN"
          },
          "availability": "https://schema.org/PreOrder",
          "url": "https://www.teeahead.com/waitlist/golfer"
        },
        {
          "@type": "Offer",
          "name": "Ace Membership",
          "price": "159",
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "159",
            "priceCurrency": "USD",
            "unitCode": "ANN"
          },
          "availability": "https://schema.org/PreOrder",
          "url": "https://www.teeahead.com/waitlist/golfer"
        },
        {
          "@type": "Offer",
          "name": "Course Partner",
          "price": "349",
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "349",
            "priceCurrency": "USD",
            "unitCode": "MON"
          },
          "availability": "https://schema.org/InStock",
          "url": "https://www.teeahead.com/waitlist/course"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is TeeAhead really free for golf courses?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes — completely free for the first 10 Founding Partner courses for your full first year. No barter tee times, no commissions, no hidden fees. After year one, it's a flat $349/month. No long-term contract. Cancel anytime."
          }
        },
        {
          "@type": "Question",
          "name": "When does TeeAhead launch?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We're onboarding Founding Partner courses now and targeting a full golfer-facing launch in Summer 2026. Founding Partners go live within 48 hours of signing."
          }
        },
        {
          "@type": "Question",
          "name": "What if my course already uses EZLinks, foreUP, or another booking system?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "TeeAhead is designed to work alongside or replace your current booking system. We handle the setup. Email neil@teeahead.com for a straight answer about your specific setup."
          }
        },
        {
          "@type": "Question",
          "name": "Who is behind TeeAhead?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Neil Barris and Billy Beslock, both based in Metro Detroit. Neil built Outing.golf inside the golf industry. Billy is the golfer who got tired of paying fees and watching loyalty points expire. Reachable directly at neil@teeahead.com and billy@teeahead.com."
          }
        }
      ]
    }
  ]
}
```

### Article Schema — `/golfnow-alternative` only

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.teeahead.com/golfnow-alternative#article",
  "headline": "The Best GolfNow Alternative for Golf Courses and Golfers",
  "url": "https://www.teeahead.com/golfnow-alternative",
  "datePublished": "2026-04-27",
  "dateModified": "2026-04-30",
  "author": { "@id": "https://www.teeahead.com/#neil-barris" },
  "publisher": { "@id": "https://www.teeahead.com/#organization" },
  "image": {
    "@type": "ImageObject",
    "url": "https://www.teeahead.com/og-image.png",
    "width": 1200,
    "height": 630
  },
  "wordCount": 1100,
  "about": [
    { "@type": "Thing", "name": "GolfNow" },
    { "@type": "Thing", "name": "GolfPass+" }
  ],
  "mentions": [
    { "@type": "Organization", "name": "Windsor Parke Golf Club" },
    { "@type": "Organization", "name": "Missouri Bluffs Golf Club" },
    { "@type": "Organization", "name": "National Golf Course Owners Association" }
  ],
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", "h2", "p:first-of-type"]
  }
}
```
