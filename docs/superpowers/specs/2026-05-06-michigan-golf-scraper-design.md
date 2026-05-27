# Michigan Public Golf Course GM Scraper — Design Spec

**Date:** 2026-05-06
**Author:** Neil Barris / Claude
**Status:** Approved

---

## Purpose

Produce a clean, sales-ready CSV of Michigan public and semi-private golf course GMs, owners, and managers — enriched with contact info and booking software detection — for Billy to use in TeeAhead outreach.

---

## Architecture Overview

Three sequential phases:

1. **Discovery** — Google Maps Places API grids Michigan by county centroid, collects all `golf_course` place results, deduplicates, and filters out private clubs.
2. **Enrichment** — For each course, scrape the course website: detect booking software from outbound links/iframes, and extract GM/owner contact info from `/contact`, `/about`, `/staff` pages.
3. **Export** — Deduplicate, assign priority tier, sort, and write CSV + summary text file.

---

## Phase 1 — Discovery (Google Maps Places API)

### Method

- Use **Nearby Search** (`type=golf_course`) centered on each of Michigan's 83 county centroids, radius 20km.
- Paginate each search up to 3 pages (60 results max per centroid).
- Dedup on Google Place ID — a course near two county centroids appears only once.
- One **Place Details** call per unique course to retrieve: `name`, `formatted_address`, `formatted_phone_number`, `website`, `geometry.location` (lat/lng), `business_status`.
- Skip any course with `business_status = CLOSED_PERMANENTLY`.

### Auth

Requires `GOOGLE_MAPS_API_KEY` in environment. Key must have **Places API (New)** and optionally **Geocoding API** enabled. Estimated API cost for full Michigan run: under $10 (within free $200/mo tier).

### Private Club Filter

Hard-skip at parse time if course name contains any of (case-insensitive):
`country club`, ` cc `, ` cc,`, ` cc)`, `private`, `members only`, `yacht club`, `estates club`, `national club`

Keep: Public, Semi-Private, Daily Fee, Resort, Municipal.

### Output of Phase 1

Array of course objects:
```
{
  place_id, name, address, city, state, zip,
  phone, website, lat, lng, source_url
}
```

---

## Phase 2 — Enrichment (Website Scraping)

### Rate Limiting

- 1.5s minimum delay between requests to the same domain.
- Max 3 pages/minute per domain.
- On HTTP error or timeout: retry once after 3s, then skip and log to `errors.log`.
- Rotate through 5 User-Agent strings (common desktop browser UAs).

### 2A — Booking Software Detection

HTTP GET the course website (and follow one redirect). Scan full HTML response for:

| Signature string(s) | Tag |
|---|---|
| `golfnow.com`, `bookgolfnow` | GolfNow |
| `foreup.com` | foreUP |
| `ezlinks.com` | EZLinks |
| `chronogolf.com`, `lightspeedgolf` | Lightspeed/Chronogolf |
| `clubcaddie.com` | Club Caddie |
| `teesnap.com` | TeeSnap |
| `teetimes.com` | TeeTimes.com |
| `golfregistrations.com` | GolfRegistrations |
| Any booking/tee-time widget not matched above | Unknown Online Booking |
| No booking signal found | Manual / Phone Only |

Set `golfnow_listed` = YES if GolfNow detected, else NO.

Also scan for membership-gating language (`"members only"`, `"membership required"`, `"private club"`) — if found, add note and flag for manual review.

### 2B — Contact Enrichment

For each course, attempt pages in this order: `/`, `/contact`, `/about`, `/staff`, `/management`, `/team`.
Stop after finding at least one name+title match, or after checking all five pages.

**Name extraction:** Find text within 200 chars of title keywords:
`General Manager`, `GM`, `Head Professional`, `Head Pro`, `PGA Professional`, `Director of Golf`, `Owner`, `Course Manager`, `Club Manager`

Use a regex like: `([A-Z][a-z]+ [A-Z][a-z]+)\s*[,\n|–-]\s*(General Manager|GM|Head Pro[fessional]*|Owner|Director of Golf|Course Manager)`

**Email extraction:** Standard email regex across full page text.

**Phone extraction:** US phone patterns `(XXX) XXX-XXXX` and `XXX-XXX-XXXX` across full page text. Prefer numbers distinct from the course's main Maps phone (which we already have).

Record: `contact_name`, `contact_title`, `contact_email`, `contact_phone`. Leave blank if not found — do not fabricate.

---

## Phase 3 — Deduplication, Priority & Export

### Dedup

Key: normalized name (lowercase, strip `golf course`, `golf club`, `the`, punctuation) + city.
If two records match: merge, preferring the record with more fields populated.

### Priority Tier

ZIP → county via embedded static JSON (Michigan ZIPs only, ~1000 entries).

| Tier | Counties |
|---|---|
| HIGH | Wayne, Oakland, Macomb, Washtenaw, Livingston, Monroe, St. Clair |
| MEDIUM | All other lower-peninsula counties within bounding box lat 41.8–43.2 / lng -84.5–-82.5 |
| LOW | Upper Peninsula + far west Michigan |

### Sort Order

Primary: priority (HIGH → MEDIUM → LOW). Secondary: city (A → Z).

---

## Output Files

### `michigan_golf_courses_outreach.csv`

Columns in order:
1. `priority` — HIGH / MEDIUM / LOW
2. `course_name`
3. `city`
4. `county`
5. `zip`
6. `website`
7. `booking_software`
8. `golfnow_listed` — YES / NO
9. `contact_name`
10. `contact_title`
11. `contact_email`
12. `contact_phone`
13. `notes` — membership flag, manual review flag, etc.
14. `source_url` — Google Maps place URL

### `scrape_summary.txt`

- Total courses found
- Courses with contact info (name found)
- Courses by booking software (sorted by count)
- Courses by priority tier
- Error count + list of failed URLs

### `errors.log`

One line per failure: `[timestamp] [url] [error reason]`

---

## File Structure

```
scraper/
├── src/
│   ├── index.ts                  # Orchestrator: runs phases 1→2→3
│   ├── sources/
│   │   └── googleMaps.ts         # Places API discovery
│   ├── enrichment/
│   │   ├── bookingSoftware.ts    # Platform signature detection
│   │   └── contactScraper.ts     # GM/owner contact extraction
│   ├── utils/
│   │   ├── rateLimit.ts          # Delay + retry logic
│   │   ├── dedup.ts              # Normalize + merge records
│   │   ├── priorityFlag.ts       # ZIP→county→tier
│   │   └── miZipCounty.json      # Static ZIP→county lookup
│   ├── types.ts                  # Shared TypeScript interfaces
│   └── csvExport.ts              # CSV + summary writer
├── package.json
├── tsconfig.json
└── .env.example                  # Documents GOOGLE_MAPS_API_KEY requirement
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Yes | Google Cloud key with Places API (New) enabled |

Run command: `npx tsx src/index.ts`

Output files written to `scraper/output/` (gitignored).

---

## Explicit Out of Scope

- **No Puppeteer/Playwright** — pure HTTP + HTML parsing only
- **No Google Search scraping** — blocked too quickly without paid API
- **No LinkedIn enrichment** — no reliable headless access
- **No SerpAPI** — not purchased
- **GHIN API** — endpoint is not public; excluded
- **GolfNow site scraping** — Cloudflare-blocked without browser; detection via course website links only

---

## Known Limitations

- Contact info hit rate will be partial (~30-50% of courses list GM names publicly). HIGH-priority courses should be manually verified before Billy dials.
- Some course websites use JavaScript-heavy booking widgets that aren't detectable from raw HTML — these will tag as "Manual / Phone Only" conservatively.
- GolfNow-listed detection is based on website link scanning, not from GolfNow's own directory.
