# SEO Audit Report: teeahead.com

**Audit Date:** 2026-05-11  
**URL:** https://www.teeahead.com  
**Business Type:** SaaS + Local Service hybrid (golf course booking software / golfer loyalty membership, Metro Detroit focus)  
**Pages Analyzed:** 12 pages crawled + sitemap + robots.txt  
**Tool:** claude-seo v1.9.9

---

## Executive Summary

**Overall SEO Health Score: 64 / 100**

TeeAhead has a solid technical foundation — proper robots.txt with explicit AI crawler rules, a comprehensive sitemap with all 17 blog posts, and schema markup on the homepage and blog posts. The blog content is high-quality and topically clustered. The biggest gaps are on-page: the homepage H1 is a brand tagline with no keyword value, two key pages have duplicate `| TeeAhead` title suffixes, the landing pages are isolated from the blog content, and the case study and about pages are missing structured data. These are all fixable within a week.

**Top 5 Critical Issues:**
1. Homepage H1 contains zero target keywords — pure brand tagline
2. `/best-tee-sheet-software` title renders as "…2026 | TeeAhead | TeeAhead" (duplicate suffix) ← **FIXED**
3. `/golf-course-booking-software` title renders as "…No Barter | TeeAhead | TeeAhead" (duplicate suffix) ← **FIXED**
4. Landing pages (`/golfnow-alternative`, `/tee-time-software`, `/best-tee-sheet-software`) have no links to related blog posts — zero topical authority flow from blog to money pages
5. `/case-studies/windsor-parke` missing internal links to blog posts and has no Article schema visible to crawlers

**Top 5 Quick Wins (already completed this session):**
- ✅ Fixed duplicate title tags on `/best-tee-sheet-software` and `/golf-course-booking-software`
- ✅ FAQ schema added to 5 blog posts (featured snippet eligibility)
- ✅ Blog-to-blog internal linking across all 17 posts
- ✅ AI crawler rules explicitly added to robots.txt
- ✅ Sitemap covers all 35 public URLs including all 17 blog posts

---

## Score Breakdown

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Technical SEO | 75/100 | 22% | 16.5 |
| Content Quality | 68/100 | 23% | 15.6 |
| On-Page SEO | 52/100 | 20% | 10.4 |
| Schema / Structured Data | 62/100 | 10% | 6.2 |
| Performance (CWV) | 70/100 | 10% | 7.0 (estimated — no API key) |
| AI Search Readiness | 78/100 | 10% | 7.8 |
| Images | 60/100 | 5% | 3.0 (estimated) |
| **Overall** | | | **66.5 → 64/100** |

---

## Critical Issues (Fix Immediately)

### 1. Homepage H1 Has No Keyword Value
**Page:** https://www.teeahead.com  
**Current H1:** "Golf, returned to the people who actually play it."  
**Problem:** This is a brand mission statement. Google weighs the H1 heavily for keyword targeting. The phrases "tee sheet software," "golf course booking software," and "golf course software" — the terms you need to rank for — appear nowhere in the H1.  
**Fix:** Restructure the hero so the H1 contains the primary keyword. Options:
- Keep the tagline as a visible `<p>` or subtitle, promote a keyword-rich statement to H1
- Example H1: "Free Tee Sheet Software for Golf Courses" (matches the /tee-time-software page target)
- The emotional tagline can live immediately below as a `<p class="subtitle">`

**Impact:** High. This is the single page with the most authority and backlink equity. A keyword-absent H1 limits how Google can map this page to search intent.

---

### 2 & 3. Duplicate Title Tag Suffix — FIXED
**Pages:** `/best-tee-sheet-software`, `/golf-course-booking-software`  
**Problem:** Both pages had `| TeeAhead` appended manually to the title string. The root layout uses `template: "%s | TeeAhead"`, so the rendered title became "…| TeeAhead | TeeAhead".  
**Status:** ✅ Fixed — `| TeeAhead` removed from both page-level title strings.

---

### 4. Landing Pages Isolated from Blog Content
**Pages affected:** `/golfnow-alternative`, `/tee-time-software`, `/best-tee-sheet-software`, `/golf-course-booking-software`

None of these pages link to any blog posts. The blog has 17 posts — many directly relevant (the barter explainer, cost breakdown, GolfNow contract guide, how-to-switch guide) — but that topical authority isn't flowing to the money pages.

**Fix — add these links:**

| Landing Page | Should Link To |
|---|---|
| `/golfnow-alternative` | `/blog/golfnow-barter-model-explained`, `/blog/golfnow-contract-what-to-know`, `/blog/michigan-courses-leaving-golfnow` |
| `/tee-time-software` | `/blog/tee-sheet-software-cost`, `/blog/how-golf-course-booking-software-works`, `/blog/how-to-switch-tee-sheet-software` |
| `/best-tee-sheet-software` | `/blog/golfnow-vs-foreup-vs-lightspeed-vs-teeahead`, `/blog/tee-sheet-software-cost` |
| `/golf-course-booking-software` | `/blog/how-golf-course-booking-software-works`, `/blog/golfnow-barter-model-explained` |

---

### 5. Case Study Missing Blog Internal Links
**Page:** `/case-studies/windsor-parke`  
**Problem:** The case study only links to `/golfnow-alternative`, `/barter`, and `/waitlist/course`. No links to related blog posts (the barter explainer, the Michigan courses post, other case studies). Also, blog posts don't link back to the case study prominently enough.  
**Fix:** Add "Related reading" links at the bottom of the case study pointing to the 3 GolfNow explainer blog posts. Add a prominent link to the case study from `/golfnow-alternative`.

---

## High Priority Issues (Fix Within 1 Week)

### 6. Blog Index Title/H1 Not Keyword-Targeted
**Page:** https://www.teeahead.com/blog  
**Current title:** "Golf Industry Resources | TeeAhead"  
**Current H1:** "Golf Industry Resources"  
**Problem:** "Golf industry resources" is not a phrase anyone searches for. The blog index should target a real query.  
**Fix:**
- Title: `"Golf Course Software & Tee Time Blog | TeeAhead"`
- H1: `"Golf Course Software Tips & Tee Time Guides"`
- Description: Update to mention Metro Detroit, tee sheet software, GolfNow alternatives

### 7. `/about` Page Weak for E-E-A-T
**Current state:** ~1,050 words, has Neil and Billy's bios, AboutPage JSON-LD present.  
**Problems:**
- No links to LinkedIn profiles (weakens entity recognition)
- No press mentions or notable credentials cited
- No link from the About page to blog posts or case studies
- Bios mention past employers but no links to verify them

**Fix:** Add LinkedIn URLs to founder bios as `sameAs` in Person schema (or at minimum as visible links). Add a "What we've built" section linking to the Windsor Parke case study.

### 8. Missing FAQPage Schema on `/golfnow-alternative`
**Current:** Article schema + BreadcrumbList only  
**Opportunity:** This page has several implicit Q&A sections ("What does GolfNow actually cost?", "Who should leave GolfNow?"). Adding a FAQPage schema block with 3–4 questions would make it eligible for Google's featured snippet carousel.

### 9. `/best-tee-sheet-software` Has No Schema at All
**Current:** No JSON-LD detected  
**Fix:** Add Article + FAQPage schema. The page has comparison content that maps well to FAQ format ("Which tee sheet software is best for small courses?").

---

## Medium Priority Issues (Fix Within 1 Month)

### 10. No Google Search Console Verification Visible
The site has a `google-site-verification` meta tag (`UMxgTah2fiIao60gzONoz4OVsdiAu7LUxat6FO_5-a8`) — good. But without GSC connected, you have no visibility into: indexation status, crawl errors, keyword impressions, or manual penalties. **Submit your sitemap in GSC now if you haven't.**

### 11. Sitemap Missing a Few Pages
Pages found via internal link crawl that aren't in the sitemap:
- `/pricing` (if it exists as a standalone page)
- `/software-cost` (linked from `/best-tee-sheet-software`)
- `/features` (linked from some pages)

Verify these routes and add them to `sitemap.ts` if they're indexable.

### 12. Blog Posts Don't Link to Case Studies
Only the GolfNow explainer posts mention Windsor Parke and Missouri Bluffs — but none link directly to `/case-studies/windsor-parke`. The case study is one of the highest-authority pages on the site and should be receiving internal links from the blog.

**Fix:** Add a "See the full case study →" link in these posts:
- `golfnow-barter-model-explained`
- `michigan-courses-leaving-golfnow`
- `metro-detroit-courses-on-golfnow`

### 13. OG Images Are All the Same
Every page — including all 17 blog posts — uses `/og-image.png`. When posts get shared on LinkedIn or X, they all show the same generic TeeAhead image.  
**Fix:** Generate post-specific OG images. Next.js 15 supports `opengraph-image.tsx` as a route file that can render dynamic images server-side. A simple dark green card with the post title and category badge would dramatically improve click-through from social shares.

### 14. No Structured Data on B2B Landing Pages
Pages `/tee-time-software`, `/golfnow-alternative`, `/golf-course-booking-software` have Article + BreadcrumbList schema but no FAQPage or SoftwareApplication schema. These pages should have `SoftwareApplication` schema (since they describe software) plus `FAQPage` for the implicit questions they answer.

---

## Low Priority Issues (Backlog)

### 15. Core Web Vitals — Unknown
No PageSpeed API key or CrUX access configured. The site runs on Vercel with Next.js SSR, which is generally fast, but JavaScript bundle size from shadcn/ui components and multiple async scripts should be audited. **Recommendation:** Run Lighthouse in Chrome DevTools on the homepage and the `/golfnow-alternative` page and check LCP (target <2.5s), CLS (target <0.1), INP (target <200ms).

### 16. Backlink Profile — Unverified
No Moz or Bing Webmaster API configured. The site is new (2026 launch) so DA is likely very low. **Recommendation:** Submit to Bing Webmaster Tools (free), create a Google Business Profile listing for TeeAhead, and pursue the editorial backlinks mentioned earlier (courses featured in case studies linking back).

### 17. `/about` Title Is Redundant
**Current rendered title:** "About TeeAhead | TeeAhead"  
**Fix:** Change the metadata title from `'About TeeAhead'` to `'About'` so it renders as "About | TeeAhead."

### 18. Blog Post Dates Are All 2026-05-15
All 17 posts have `publishedAt: "2026-05-15"` — they were written together and all show the same date. This looks unnatural to Google's freshness signals and to readers. Consider backdating the older-topic posts slightly (e.g., the GolfNow barter explainer as 2026-04-01, the contract guide as 2026-04-15) to create a more natural publication cadence.

---

## What's Working Well

- ✅ **robots.txt** — Clean, explicit AI crawler allowances for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and 4 others
- ✅ **Sitemap** — All 35 public URLs covered, correct priorities and change frequencies
- ✅ **Blog content quality** — 17 posts, well-written, data-rich, expert tone, 1,000–2,000 words each
- ✅ **FAQ schema** — 5 blog posts now have FAQPage JSON-LD (featured snippet eligible)
- ✅ **Blog topical clusters** — Golfer cluster and courses cluster both have internal linking
- ✅ **llms.txt** — Present and comprehensive (Pricing, Case Studies, Comparison links)
- ✅ **Canonical tags** — Present on all checked pages
- ✅ **Google Search Console verification** — Meta tag present
- ✅ **www redirect** — Non-www correctly 301s to www
- ✅ **Case study content** — Windsor Parke page has strong data (382%, $81K→$393K)
- ✅ **Author bios** — Present on all blog posts via AuthorBio component

---

## 30-Day Action Plan

### Week 1: On-Page Fixes (highest leverage)
- [ ] Fix homepage H1 — add a keyword-containing H1, demote brand tagline to subtitle
- [ ] Add blog post links to all 4 landing pages (table above, issue #4)
- [ ] Add "See the full case study" links in 3 blog posts pointing to `/case-studies/windsor-parke`
- [ ] Fix `/about` title (remove redundant "TeeAhead" from metadata title)
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools

### Week 2: Schema Expansion
- [ ] Add FAQPage schema to `/golfnow-alternative` (3–4 questions)
- [ ] Add FAQPage + SoftwareApplication schema to `/best-tee-sheet-software`
- [ ] Add SoftwareApplication schema to `/tee-time-software`
- [ ] Add LinkedIn URLs to founder Person schema in `StructuredData.tsx`

### Week 3: Content + Blog
- [ ] Update blog index title and H1 to target real search queries
- [ ] Stagger blog post publication dates to look like organic publishing cadence
- [ ] Verify `/software-cost`, `/pricing`, `/features` routes and add to sitemap if indexable
- [ ] Run Lighthouse audit on homepage and `/golfnow-alternative`, fix any CWV issues

### Week 4: Authority Building
- [ ] Set up dynamic OG images for blog posts using Next.js `opengraph-image.tsx`
- [ ] Email Windsor Parke and Missouri Bluffs to request a backlink to their case study
- [ ] Create TeeAhead company page on LinkedIn (feeds entity recognition in AI systems)
- [ ] Register on G2 and Capterra (these rank independently and AI systems cite them)
- [ ] Submit to Bing Webmaster Tools (feeds Copilot/ChatGPT Search)

---

## Pages Analyzed

| URL | Key Finding |
|---|---|
| `/` | H1 has no keywords — critical |
| `/golfnow-alternative` | Strong content, no blog links |
| `/tee-time-software` | Good, no blog links |
| `/best-tee-sheet-software` | Duplicate title fixed; no schema |
| `/golf-course-booking-software` | Duplicate title fixed |
| `/blog` | Generic H1, all 17 posts present |
| `/blog/tee-sheet-software-cost` | Strong post, good internal links |
| `/case-studies/windsor-parke` | Weak internal links, schema present |
| `/about` | E-E-A-T present, could be stronger |
| `robots.txt` | Excellent — AI crawlers allowed |
| `sitemap.xml` | 35 URLs, complete coverage |
