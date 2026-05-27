# Michigan Golf Course Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js scraper that discovers Michigan public golf courses via Google Maps Places API, enriches each with booking software detection and GM contact info from course websites, and exports a sales-ready CSV for TeeAhead outreach.

**Architecture:** Phase 1 grids Michigan's 83 county centroids with Nearby Search (type=golf_course), deduplicates on Place ID, and fetches details per course. Phase 2 scrapes each course website for booking platform signatures and GM/owner contact info. Phase 3 assigns priority tiers and exports CSV + summary.

**Tech Stack:** Node.js, TypeScript (tsx), axios, cheerio, csv-writer, vitest, dotenv

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/types.ts` | Shared TypeScript interfaces |
| `src/utils/rateLimit.ts` | HTTP fetch with per-domain 1.5s delay + 1 retry |
| `src/utils/priorityFlag.ts` | County → HIGH/MEDIUM/LOW tier |
| `src/utils/dedup.ts` | Normalize course key, merge records |
| `src/sources/googleMaps.ts` | Places API: county grid → course records |
| `src/enrichment/bookingSoftware.ts` | HTML scanning for booking platform signatures |
| `src/enrichment/contactScraper.ts` | GM name/title/email/phone extraction |
| `src/csvExport.ts` | Write CSV + scrape_summary.txt |
| `src/index.ts` | Orchestrator: phases 1 → 2 → 3 |
| `src/__tests__/*.test.ts` | Unit tests |

---

### Task 1: Project Scaffold

**Files:**
- Create: `scraper/package.json`
- Create: `scraper/tsconfig.json`
- Create: `scraper/vitest.config.ts`
- Create: `scraper/.env.example`
- Create: `scraper/.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p scraper/src/sources scraper/src/enrichment scraper/src/utils scraper/src/__tests__ scraper/output
```

- [ ] **Step 2: Write `scraper/package.json`**

```json
{
  "name": "michigan-golf-scraper",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0",
    "csv-writer": "^1.6.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 3: Write `scraper/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write `scraper/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', globals: true },
});
```

- [ ] **Step 5: Write `scraper/.env.example`**

```
# Required: Google Cloud key with Places API (New) enabled
GOOGLE_MAPS_API_KEY=your_key_here
```

- [ ] **Step 6: Write `scraper/.gitignore`**

```
node_modules/
dist/
output/
.env
```

- [ ] **Step 7: Install dependencies**

```bash
cd scraper && npm install
```

Expected: ~30s, `node_modules/` created, no errors.

- [ ] **Step 8: Commit**

```bash
git add scraper/
git commit -m "feat(scraper): project scaffold"
```

---

### Task 2: Types

**Files:**
- Create: `scraper/src/types.ts`

- [ ] **Step 1: Write `scraper/src/types.ts`**

```typescript
export interface CourseRecord {
  place_id: string;
  course_name: string;
  city: string;
  county: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  booking_software: string;
  golfnow_listed: 'YES' | 'NO';
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | '';
  notes: string;
  source_url: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add scraper/src/types.ts
git commit -m "feat(scraper): shared types"
```

---

### Task 3: Rate Limiter

**Files:**
- Create: `scraper/src/utils/rateLimit.ts`
- Create: `scraper/src/__tests__/rateLimit.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/rateLimit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('axios');
import axios from 'axios';
import { fetchWithRateLimit, randomUA } from '../utils/rateLimit';

describe('fetchWithRateLimit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns response data on success', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: '<html>test</html>' });
    expect(await fetchWithRateLimit('http://example.com')).toBe('<html>test</html>');
  });

  it('returns null after exhausting retries', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await fetchWithRateLimit('http://example.com', 0)).toBeNull();
  });

  it('sends a User-Agent header', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: '' });
    await fetchWithRateLimit('http://example.com');
    const args = vi.mocked(axios.get).mock.calls[0][1];
    expect(args?.headers?.['User-Agent']).toBeTruthy();
  });
});

describe('randomUA', () => {
  it('returns a non-empty string', () => {
    expect(randomUA().length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/rateLimit.test.ts
```

Expected: FAIL — `Cannot find module '../utils/rateLimit'`

- [ ] **Step 3: Write `scraper/src/utils/rateLimit.ts`**

```typescript
import axios from 'axios';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

export function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

const domainLastRequest = new Map<string, number>();

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRateLimit(url: string, retries = 1): Promise<string | null> {
  const domain = getDomain(url);
  const last = domainLastRequest.get(domain) ?? 0;
  const wait = 1500 - (Date.now() - last);
  if (wait > 0) await sleep(wait);

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': randomUA() },
      timeout: 10000,
      maxRedirects: 2,
    });
    domainLastRequest.set(domain, Date.now());
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  } catch {
    if (retries > 0) {
      await sleep(3000);
      return fetchWithRateLimit(url, retries - 1);
    }
    return null;
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/rateLimit.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/utils/rateLimit.ts scraper/src/__tests__/rateLimit.test.ts
git commit -m "feat(scraper): rate-limiting HTTP fetch with retry"
```

---

### Task 4: Priority Flag

**Files:**
- Create: `scraper/src/utils/priorityFlag.ts`
- Create: `scraper/src/__tests__/priorityFlag.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/priorityFlag.test.ts
import { describe, it, expect } from 'vitest';
import { assignPriority } from '../utils/priorityFlag';

describe('assignPriority', () => {
  it('returns HIGH for Oakland County', () =>
    expect(assignPriority('Oakland', 42.67, -83.38)).toBe('HIGH'));
  it('returns HIGH for Wayne County', () =>
    expect(assignPriority('Wayne', 42.32, -83.18)).toBe('HIGH'));
  it('returns HIGH for Macomb County', () =>
    expect(assignPriority('Macomb', 42.67, -82.90)).toBe('HIGH'));
  it('returns HIGH for Washtenaw County', () =>
    expect(assignPriority('Washtenaw', 42.25, -83.97)).toBe('HIGH'));
  it('returns HIGH for Livingston County', () =>
    expect(assignPriority('Livingston', 42.60, -83.97)).toBe('HIGH'));
  it('returns HIGH for Monroe County', () =>
    expect(assignPriority('Monroe', 41.93, -83.48)).toBe('HIGH'));
  it('returns HIGH for St. Clair County', () =>
    expect(assignPriority('St. Clair', 42.92, -82.70)).toBe('HIGH'));
  it('returns MEDIUM for Ingham County (inside bbox, not HIGH)', () =>
    expect(assignPriority('Ingham', 42.60, -84.37)).toBe('MEDIUM'));
  it('returns LOW for Marquette County (Upper Peninsula)', () =>
    expect(assignPriority('Marquette', 46.55, -87.60)).toBe('LOW'));
  it('returns LOW for Kent County (west Michigan, outside bbox)', () =>
    expect(assignPriority('Kent', 43.03, -85.52)).toBe('LOW'));
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/priorityFlag.test.ts
```

- [ ] **Step 3: Write `scraper/src/utils/priorityFlag.ts`**

```typescript
const HIGH_PRIORITY_COUNTIES = new Set([
  'Wayne', 'Oakland', 'Macomb', 'Washtenaw', 'Livingston', 'Monroe', 'St. Clair',
]);

const BBOX = { minLat: 41.8, maxLat: 43.2, minLng: -84.5, maxLng: -82.5 };

export function assignPriority(
  county: string,
  lat: number,
  lng: number,
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (HIGH_PRIORITY_COUNTIES.has(county)) return 'HIGH';
  if (lat >= BBOX.minLat && lat <= BBOX.maxLat && lng >= BBOX.minLng && lng <= BBOX.maxLng) {
    return 'MEDIUM';
  }
  return 'LOW';
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/priorityFlag.test.ts
```

Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/utils/priorityFlag.ts scraper/src/__tests__/priorityFlag.test.ts
git commit -m "feat(scraper): priority tier assignment"
```

---

### Task 5: Dedup Utility

**Files:**
- Create: `scraper/src/utils/dedup.ts`
- Create: `scraper/src/__tests__/dedup.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/dedup.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeCourseKey, deduplicateCourses } from '../utils/dedup';
import type { CourseRecord } from '../types';

const base: CourseRecord = {
  place_id: 'x', course_name: '', city: '', county: '', zip: '',
  lat: 0, lng: 0, phone: '', website: '', booking_software: '',
  golfnow_listed: 'NO', contact_name: '', contact_title: '',
  contact_email: '', contact_phone: '', priority: '', notes: '', source_url: '',
};

describe('normalizeCourseKey', () => {
  it('strips Golf Course suffix', () =>
    expect(normalizeCourseKey('Fieldstone Golf Course', 'Auburn Hills')).toBe('fieldstone::auburn hills'));
  it('strips The and Golf Club', () =>
    expect(normalizeCourseKey('The Highlands Golf Club', 'Hastings')).toBe('highlands::hastings'));
  it('strips punctuation', () =>
    expect(normalizeCourseKey("Eagle's Nest Golf", 'Milford')).toBe('eaglesnest::milford'));
});

describe('deduplicateCourses', () => {
  it('merges two records with same key, prefers populated fields', () => {
    const a: CourseRecord = { ...base, place_id: 'a', course_name: 'Fieldstone Golf Course', city: 'Auburn Hills', website: '' };
    const b: CourseRecord = { ...base, place_id: 'b', course_name: 'Fieldstone Golf Course', city: 'Auburn Hills', website: 'https://fieldstone.com' };
    const result = deduplicateCourses([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0].website).toBe('https://fieldstone.com');
  });
  it('keeps records with different cities', () => {
    const a: CourseRecord = { ...base, place_id: 'a', course_name: 'Pines Golf', city: 'Brighton' };
    const b: CourseRecord = { ...base, place_id: 'b', course_name: 'Pines Golf', city: 'Howell' };
    expect(deduplicateCourses([a, b])).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/dedup.test.ts
```

- [ ] **Step 3: Write `scraper/src/utils/dedup.ts`**

```typescript
import type { CourseRecord } from '../types';

export function normalizeCourseKey(name: string, city: string): string {
  const n = name.toLowerCase()
    .replace(/\b(golf course|golf club|golf|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return `${n}::${city.toLowerCase().trim()}`;
}

export function deduplicateCourses(courses: CourseRecord[]): CourseRecord[] {
  const seen = new Map<string, CourseRecord>();
  for (const course of courses) {
    const key = normalizeCourseKey(course.course_name, course.city);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...course });
    } else {
      const merged = { ...existing };
      for (const field of Object.keys(course) as (keyof CourseRecord)[]) {
        if (!merged[field] && course[field]) (merged as any)[field] = course[field];
      }
      seen.set(key, merged);
    }
  }
  return Array.from(seen.values());
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/dedup.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/utils/dedup.ts scraper/src/__tests__/dedup.test.ts
git commit -m "feat(scraper): dedup and merge course records"
```

---

### Task 6: Booking Software Detection

**Files:**
- Create: `scraper/src/enrichment/bookingSoftware.ts`
- Create: `scraper/src/__tests__/bookingSoftware.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/bookingSoftware.test.ts
import { describe, it, expect } from 'vitest';
import { detectFromHtml } from '../enrichment/bookingSoftware';

describe('detectFromHtml', () => {
  it('detects GolfNow from link href', () => {
    const r = detectFromHtml('<a href="https://www.golfnow.com/tee-times/12345">Book</a>');
    expect(r.platform).toBe('GolfNow');
    expect(r.golfnowListed).toBe(true);
  });
  it('detects foreUP from iframe', () => {
    const r = detectFromHtml('<iframe src="https://foreupsoftware.foreup.com/index.html"></iframe>');
    expect(r.platform).toBe('foreUP');
    expect(r.golfnowListed).toBe(false);
  });
  it('detects EZLinks', () =>
    expect(detectFromHtml('<a href="https://book.ezlinks.com/search">Book</a>').platform).toBe('EZLinks'));
  it('detects Lightspeed/Chronogolf', () =>
    expect(detectFromHtml('<script src="https://app.chronogolf.com/widget.js"></script>').platform).toBe('Lightspeed/Chronogolf'));
  it('detects Club Caddie', () =>
    expect(detectFromHtml('<a href="https://clubcaddie.com/login/">Members</a>').platform).toBe('Club Caddie'));
  it('detects TeeSnap', () =>
    expect(detectFromHtml('<a href="https://teesnap.com/tee-times/riverside">Book</a>').platform).toBe('TeeSnap'));
  it('returns Manual/Phone Only when nothing found', () => {
    const r = detectFromHtml('<p>Call 555-1234 to book</p>');
    expect(r.platform).toBe('Manual / Phone Only');
    expect(r.golfnowListed).toBe(false);
  });
  it('flags membership language', () =>
    expect(detectFromHtml('<p>This club is members only.</p>').membershipGated).toBe(true));
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/bookingSoftware.test.ts
```

- [ ] **Step 3: Write `scraper/src/enrichment/bookingSoftware.ts`**

```typescript
import { fetchWithRateLimit } from '../utils/rateLimit';

const BOOKING_SIGNATURES: [RegExp, string][] = [
  [/golfnow\.com|bookgolfnow/i, 'GolfNow'],
  [/foreup\.com/i, 'foreUP'],
  [/ezlinks\.com/i, 'EZLinks'],
  [/chronogolf\.com|lightspeedgolf/i, 'Lightspeed/Chronogolf'],
  [/clubcaddie\.com/i, 'Club Caddie'],
  [/teesnap\.com/i, 'TeeSnap'],
  [/teetimes\.com/i, 'TeeTimes.com'],
  [/golfregistrations\.com/i, 'GolfRegistrations'],
];

const MEMBERSHIP_PATTERNS = [
  /members?\s+only/i, /membership\s+required/i, /private\s+club/i,
];

export interface BookingResult {
  platform: string;
  golfnowListed: boolean;
  membershipGated: boolean;
}

export function detectFromHtml(html: string): BookingResult {
  let platform = 'Manual / Phone Only';
  for (const [pattern, name] of BOOKING_SIGNATURES) {
    if (pattern.test(html)) { platform = name; break; }
  }
  return {
    platform,
    golfnowListed: /golfnow\.com|bookgolfnow/i.test(html),
    membershipGated: MEMBERSHIP_PATTERNS.some(p => p.test(html)),
  };
}

export async function detectBookingSoftware(website: string): Promise<BookingResult> {
  const empty: BookingResult = { platform: 'Manual / Phone Only', golfnowListed: false, membershipGated: false };
  if (!website) return empty;
  const html = await fetchWithRateLimit(website);
  return html ? detectFromHtml(html) : empty;
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/bookingSoftware.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/enrichment/bookingSoftware.ts scraper/src/__tests__/bookingSoftware.test.ts
git commit -m "feat(scraper): booking software detection from HTML"
```

---

### Task 7: Contact Scraper

**Files:**
- Create: `scraper/src/enrichment/contactScraper.ts`
- Create: `scraper/src/__tests__/contactScraper.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/contactScraper.test.ts
import { describe, it, expect } from 'vitest';
import { extractContact } from '../enrichment/contactScraper';

describe('extractContact', () => {
  it('extracts name and General Manager title', () => {
    const r = extractContact('<p>John Smith, General Manager</p>');
    expect(r.name).toBe('John Smith');
    expect(r.title).toBe('General Manager');
  });
  it('extracts name and Head Professional title with em-dash', () => {
    const r = extractContact('<div>Sarah Johnson — Head Professional</div>');
    expect(r.name).toBe('Sarah Johnson');
    expect(r.title).toBe('Head Professional');
  });
  it('extracts email, preferring non-generic address', () => {
    const r = extractContact('<p>info@example.com or manager@riverview.com</p>');
    expect(r.email).toBe('manager@riverview.com');
  });
  it('extracts parenthetical phone', () => {
    expect(extractContact('<p>Call (248) 555-1234</p>').phone).toBe('(248) 555-1234');
  });
  it('extracts dashed phone', () => {
    expect(extractContact('<p>313-555-9876</p>').phone).toBe('313-555-9876');
  });
  it('returns empty strings when nothing found', () => {
    const r = extractContact('<p>Welcome to our course.</p>');
    expect(r.name).toBe('');
    expect(r.email).toBe('');
    expect(r.phone).toBe('');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/contactScraper.test.ts
```

- [ ] **Step 3: Write `scraper/src/enrichment/contactScraper.ts`**

```typescript
import { fetchWithRateLimit } from '../utils/rateLimit';

const TITLES = [
  'General Manager', 'GM', 'Head Professional', 'Head Pro',
  'PGA Professional', 'Director of Golf', 'Owner', 'Course Manager',
  'Club Manager', 'Golf Director',
].join('|');

const NAME_REGEX = new RegExp(
  `([A-Z][a-z]+ [A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s*[,\\n|\\u2013\\u2014-]\\s*(${TITLES})`,
  'g',
);
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\(\d{3}\)\s*\d{3}[-.\s]\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/g;

export interface ContactResult {
  name: string; title: string; email: string; phone: string;
}

export function extractContact(html: string): ContactResult {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  NAME_REGEX.lastIndex = 0;
  const nameMatch = NAME_REGEX.exec(text);
  NAME_REGEX.lastIndex = 0;

  const emails = text.match(EMAIL_REGEX) ?? [];
  const email = emails.find(e => !/^(info|support|admin|contact|hello|webmaster)@/i.test(e)) ?? emails[0] ?? '';
  const phone = (text.match(PHONE_REGEX) ?? [])[0] ?? '';

  return {
    name: nameMatch?.[1]?.trim() ?? '',
    title: nameMatch?.[2]?.trim() ?? '',
    email,
    phone,
  };
}

const CONTACT_PAGES = ['/contact', '/about', '/staff', '/management', '/team'];

export async function scrapeContact(website: string): Promise<ContactResult> {
  const empty: ContactResult = { name: '', title: '', email: '', phone: '' };
  if (!website) return empty;
  const base = website.replace(/\/$/, '');
  for (const page of ['', ...CONTACT_PAGES]) {
    const html = await fetchWithRateLimit(page ? `${base}${page}` : base);
    if (!html) continue;
    const result = extractContact(html);
    if (result.name || result.email) return result;
  }
  return empty;
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/contactScraper.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/enrichment/contactScraper.ts scraper/src/__tests__/contactScraper.test.ts
git commit -m "feat(scraper): GM/owner contact extraction"
```

---

### Task 8: CSV Exporter

**Files:**
- Create: `scraper/src/csvExport.ts`
- Create: `scraper/src/__tests__/csvExport.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/csvExport.test.ts
import { describe, it, expect } from 'vitest';
import { buildSummary } from '../csvExport';
import type { CourseRecord } from '../types';

const mc = (o: Partial<CourseRecord> = {}): CourseRecord => ({
  place_id: 'x', course_name: 'Test Golf', city: 'Detroit', county: 'Wayne',
  zip: '48201', lat: 42.33, lng: -83.05, phone: '', website: '',
  booking_software: 'GolfNow', golfnow_listed: 'YES',
  contact_name: 'John Smith', contact_title: 'GM', contact_email: 'j@t.com',
  contact_phone: '', priority: 'HIGH', notes: '', source_url: '', ...o,
});

describe('buildSummary', () => {
  it('shows total courses', () =>
    expect(buildSummary([mc(), mc({ place_id: 'b' })], 0)).toContain('Total courses: 2'));
  it('counts courses with contact info', () =>
    expect(buildSummary([mc(), mc({ place_id: 'b', contact_name: '' })], 0)).toContain('With contact info: 1'));
  it('shows booking software counts', () => {
    const s = buildSummary([mc(), mc({ place_id: 'b' }), mc({ place_id: 'c', booking_software: 'foreUP' })], 0);
    expect(s).toContain('GolfNow: 2');
    expect(s).toContain('foreUP: 1');
  });
  it('shows priority counts and error count', () => {
    const s = buildSummary([mc(), mc({ place_id: 'b', priority: 'MEDIUM' })], 3);
    expect(s).toContain('HIGH: 1');
    expect(s).toContain('MEDIUM: 1');
    expect(s).toContain('Errors: 3');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/csvExport.test.ts
```

- [ ] **Step 3: Write `scraper/src/csvExport.ts`**

```typescript
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import type { CourseRecord } from './types';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function writeCsv(courses: CourseRecord[]): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const writer = createObjectCsvWriter({
    path: path.join(OUTPUT_DIR, 'michigan_golf_courses_outreach.csv'),
    header: [
      { id: 'priority', title: 'priority' },
      { id: 'course_name', title: 'course_name' },
      { id: 'city', title: 'city' },
      { id: 'county', title: 'county' },
      { id: 'zip', title: 'zip' },
      { id: 'website', title: 'website' },
      { id: 'booking_software', title: 'booking_software' },
      { id: 'golfnow_listed', title: 'golfnow_listed' },
      { id: 'contact_name', title: 'contact_name' },
      { id: 'contact_title', title: 'contact_title' },
      { id: 'contact_email', title: 'contact_email' },
      { id: 'contact_phone', title: 'contact_phone' },
      { id: 'notes', title: 'notes' },
      { id: 'source_url', title: 'source_url' },
    ],
  });
  await writer.writeRecords(courses);
}

export function buildSummary(courses: CourseRecord[], errorCount: number): string {
  const withContact = courses.filter(c => c.contact_name).length;
  const byPlatform = new Map<string, number>();
  const byPriority = new Map<string, number>();
  for (const c of courses) {
    byPlatform.set(c.booking_software, (byPlatform.get(c.booking_software) ?? 0) + 1);
    byPriority.set(c.priority, (byPriority.get(c.priority) ?? 0) + 1);
  }
  const platformLines = [...byPlatform.entries()]
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  const priorityLines = ['HIGH', 'MEDIUM', 'LOW']
    .map(t => `  ${t}: ${byPriority.get(t) ?? 0}`).join('\n');
  return [
    'Michigan Golf Course Scrape Summary',
    '===================================',
    `Total courses: ${courses.length}`,
    `With contact info: ${withContact}`,
    `Errors: ${errorCount}`,
    '',
    'By Booking Software:',
    platformLines,
    '',
    'By Priority Tier:',
    priorityLines,
  ].join('\n');
}

export async function writeSummary(courses: CourseRecord[], errorCount: number): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'scrape_summary.txt'), buildSummary(courses, errorCount), 'utf8');
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/csvExport.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/csvExport.ts scraper/src/__tests__/csvExport.test.ts
git commit -m "feat(scraper): CSV and summary export"
```

---

### Task 9: Google Maps Source

**Files:**
- Create: `scraper/src/sources/googleMaps.ts`
- Create: `scraper/src/__tests__/googleMaps.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/src/__tests__/googleMaps.test.ts
import { describe, it, expect } from 'vitest';
import { isPrivateCourse, extractAddressComponent } from '../sources/googleMaps';

describe('isPrivateCourse', () => {
  it('flags Country Club', () => expect(isPrivateCourse('Bloomfield Hills Country Club')).toBe(true));
  it('flags standalone CC', () => expect(isPrivateCourse('Oakland CC')).toBe(true));
  it('flags Private in name', () => expect(isPrivateCourse('Private Golf Reserve')).toBe(true));
  it('allows CC inside a longer word', () => expect(isPrivateCourse('McCormick Woods Golf')).toBe(false));
  it('allows normal public course', () => expect(isPrivateCourse('Fieldstone Golf Course')).toBe(false));
});

describe('extractAddressComponent', () => {
  const components = [
    { long_name: 'Auburn Hills', types: ['locality'] },
    { long_name: 'Oakland County', types: ['administrative_area_level_2'] },
    { long_name: '48326', types: ['postal_code'] },
  ];
  it('extracts city', () => expect(extractAddressComponent(components, 'locality')).toBe('Auburn Hills'));
  it('strips County suffix', () => expect(extractAddressComponent(components, 'administrative_area_level_2')).toBe('Oakland'));
  it('extracts ZIP', () => expect(extractAddressComponent(components, 'postal_code')).toBe('48326'));
  it('returns empty string for missing type', () => expect(extractAddressComponent(components, 'sublocality')).toBe(''));
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd scraper && npx vitest run src/__tests__/googleMaps.test.ts
```

- [ ] **Step 3: Write `scraper/src/sources/googleMaps.ts`**

```typescript
import axios from 'axios';
import type { CourseRecord } from '../types';

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';

interface AddressComponent { long_name: string; types: string[] }
interface PlacesResult {
  place_id: string; name: string;
  geometry: { location: { lat: number; lng: number } };
  business_status?: string;
}
interface PlaceDetails {
  name: string; formatted_address: string;
  formatted_phone_number?: string; website?: string;
  geometry: { location: { lat: number; lng: number } };
  business_status?: string; address_components: AddressComponent[];
}

const PRIVATE_PATTERNS = [
  /country\s+club/i, /\bcc\b/i, /\bprivate\b/i,
  /members?\s+only/i, /yacht\s+club/i, /national\s+club/i,
];

export function isPrivateCourse(name: string): boolean {
  return PRIVATE_PATTERNS.some(p => p.test(name));
}

export function extractAddressComponent(components: AddressComponent[], type: string): string {
  const match = components.find(c => c.types.includes(type));
  if (!match) return '';
  return type === 'administrative_area_level_2'
    ? match.long_name.replace(/\s+county$/i, '').trim()
    : match.long_name;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// All 83 Michigan county centroids
export const MICHIGAN_COUNTY_CENTROIDS = [
  // Lower Peninsula
  { county: 'Alcona', lat: 44.67, lng: -83.40 },
  { county: 'Allegan', lat: 42.60, lng: -85.87 },
  { county: 'Alpena', lat: 45.08, lng: -83.44 },
  { county: 'Antrim', lat: 45.12, lng: -85.17 },
  { county: 'Arenac', lat: 44.04, lng: -84.00 },
  { county: 'Barry', lat: 42.60, lng: -85.30 },
  { county: 'Bay', lat: 43.71, lng: -83.98 },
  { county: 'Benzie', lat: 44.60, lng: -86.16 },
  { county: 'Berrien', lat: 41.93, lng: -86.42 },
  { county: 'Branch', lat: 41.92, lng: -85.07 },
  { county: 'Calhoun', lat: 42.25, lng: -85.00 },
  { county: 'Cass', lat: 41.92, lng: -85.82 },
  { county: 'Charlevoix', lat: 45.32, lng: -84.99 },
  { county: 'Cheboygan', lat: 45.47, lng: -84.47 },
  { county: 'Clare', lat: 43.97, lng: -84.84 },
  { county: 'Clinton', lat: 42.95, lng: -84.60 },
  { county: 'Crawford', lat: 44.68, lng: -84.59 },
  { county: 'Eaton', lat: 42.58, lng: -84.84 },
  { county: 'Emmet', lat: 45.58, lng: -84.78 },
  { county: 'Genesee', lat: 43.02, lng: -83.73 },
  { county: 'Gladwin', lat: 43.98, lng: -84.36 },
  { county: 'Grand Traverse', lat: 44.75, lng: -85.60 },
  { county: 'Gratiot', lat: 43.28, lng: -84.60 },
  { county: 'Hillsdale', lat: 41.88, lng: -84.60 },
  { county: 'Huron', lat: 43.90, lng: -83.10 },
  { county: 'Ingham', lat: 42.60, lng: -84.37 },
  { county: 'Ionia', lat: 42.93, lng: -85.07 },
  { county: 'Iosco', lat: 44.30, lng: -83.52 },
  { county: 'Isabella', lat: 43.64, lng: -84.85 },
  { county: 'Jackson', lat: 42.25, lng: -84.40 },
  { county: 'Kalamazoo', lat: 42.25, lng: -85.52 },
  { county: 'Kalkaska', lat: 44.74, lng: -85.17 },
  { county: 'Kent', lat: 43.03, lng: -85.52 },
  { county: 'Lake', lat: 43.95, lng: -85.80 },
  { county: 'Lapeer', lat: 43.09, lng: -83.23 },
  { county: 'Leelanau', lat: 44.99, lng: -85.77 },
  { county: 'Lenawee', lat: 41.88, lng: -84.05 },
  { county: 'Livingston', lat: 42.60, lng: -83.97 },
  { county: 'Macomb', lat: 42.67, lng: -82.90 },
  { county: 'Manistee', lat: 44.24, lng: -86.13 },
  { county: 'Mason', lat: 43.95, lng: -86.00 },
  { county: 'Mecosta', lat: 43.64, lng: -85.35 },
  { county: 'Midland', lat: 43.67, lng: -84.38 },
  { county: 'Missaukee', lat: 44.35, lng: -85.10 },
  { county: 'Monroe', lat: 41.93, lng: -83.48 },
  { county: 'Montcalm', lat: 43.32, lng: -85.15 },
  { county: 'Montmorency', lat: 45.02, lng: -84.14 },
  { county: 'Muskegon', lat: 43.35, lng: -86.20 },
  { county: 'Newaygo', lat: 43.53, lng: -85.80 },
  { county: 'Oakland', lat: 42.67, lng: -83.38 },
  { county: 'Oceana', lat: 43.68, lng: -86.45 },
  { county: 'Ogemaw', lat: 44.35, lng: -84.10 },
  { county: 'Osceola', lat: 43.98, lng: -85.33 },
  { county: 'Oscoda', lat: 44.68, lng: -84.14 },
  { county: 'Otsego', lat: 45.02, lng: -84.60 },
  { county: 'Ottawa', lat: 42.93, lng: -85.97 },
  { county: 'Presque Isle', lat: 45.38, lng: -83.97 },
  { county: 'Roscommon', lat: 44.36, lng: -84.60 },
  { county: 'Saginaw', lat: 43.32, lng: -84.05 },
  { county: 'St. Clair', lat: 42.92, lng: -82.70 },
  { county: 'St. Joseph', lat: 41.93, lng: -85.52 },
  { county: 'Sanilac', lat: 43.43, lng: -82.88 },
  { county: 'Shiawassee', lat: 42.97, lng: -84.15 },
  { county: 'Tuscola', lat: 43.50, lng: -83.42 },
  { county: 'Van Buren', lat: 42.28, lng: -86.00 },
  { county: 'Washtenaw', lat: 42.25, lng: -83.97 },
  { county: 'Wayne', lat: 42.32, lng: -83.18 },
  { county: 'Wexford', lat: 44.33, lng: -85.58 },
  // Upper Peninsula
  { county: 'Alger', lat: 46.42, lng: -86.62 },
  { county: 'Baraga', lat: 46.75, lng: -88.38 },
  { county: 'Chippewa', lat: 46.42, lng: -84.72 },
  { county: 'Delta', lat: 45.80, lng: -87.00 },
  { county: 'Dickinson', lat: 46.03, lng: -87.90 },
  { county: 'Gogebic', lat: 46.58, lng: -89.68 },
  { county: 'Houghton', lat: 47.12, lng: -88.60 },
  { county: 'Iron', lat: 46.18, lng: -88.55 },
  { county: 'Keweenaw', lat: 47.45, lng: -87.95 },
  { county: 'Luce', lat: 46.47, lng: -85.45 },
  { county: 'Mackinac', lat: 46.00, lng: -84.75 },
  { county: 'Marquette', lat: 46.55, lng: -87.60 },
  { county: 'Menominee', lat: 45.47, lng: -87.40 },
  { county: 'Ontonagon', lat: 46.80, lng: -89.25 },
  { county: 'Schoolcraft', lat: 46.05, lng: -86.22 },
];

async function nearbySearch(lat: number, lng: number, apiKey: string, pageToken?: string) {
  const params: Record<string, string> = {
    location: `${lat},${lng}`, radius: '20000', type: 'golf_course', key: apiKey,
  };
  if (pageToken) params.pagetoken = pageToken;
  const res = await axios.get(`${MAPS_BASE}/place/nearbysearch/json`, { params });
  return { results: (res.data.results ?? []) as PlacesResult[], nextToken: res.data.next_page_token as string | undefined };
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  try {
    const res = await axios.get(`${MAPS_BASE}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,geometry,business_status,address_components',
        key: apiKey,
      },
    });
    return res.data.result ?? null;
  } catch { return null; }
}

export async function discoverCourses(apiKey: string): Promise<CourseRecord[]> {
  const seen = new Set<string>();
  const courses: CourseRecord[] = [];

  for (const centroid of MICHIGAN_COUNTY_CENTROIDS) {
    let pageToken: string | undefined;
    let page = 0;
    do {
      if (pageToken) await sleep(2500);
      const { results, nextToken } = await nearbySearch(centroid.lat, centroid.lng, apiKey, pageToken);
      pageToken = nextToken;
      page++;

      for (const place of results) {
        if (seen.has(place.place_id)) continue;
        if (place.business_status === 'CLOSED_PERMANENTLY') continue;
        if (isPrivateCourse(place.name)) continue;
        seen.add(place.place_id);

        await sleep(200);
        const details = await getPlaceDetails(place.place_id, apiKey);
        if (!details) continue;

        courses.push({
          place_id: place.place_id,
          course_name: details.name,
          city: extractAddressComponent(details.address_components, 'locality'),
          county: extractAddressComponent(details.address_components, 'administrative_area_level_2'),
          zip: extractAddressComponent(details.address_components, 'postal_code'),
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
          phone: details.formatted_phone_number ?? '',
          website: details.website ?? '',
          booking_software: '', golfnow_listed: 'NO',
          contact_name: '', contact_title: '', contact_email: '', contact_phone: '',
          priority: '', notes: '',
          source_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        });
      }
    } while (pageToken && page < 3);

    await sleep(500);
  }
  return courses;
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd scraper && npx vitest run src/__tests__/googleMaps.test.ts
```

Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add scraper/src/sources/googleMaps.ts scraper/src/__tests__/googleMaps.test.ts
git commit -m "feat(scraper): Google Maps Places API course discovery"
```

---

### Task 10: Orchestrator + Full Run

**Files:**
- Create: `scraper/src/index.ts`

- [ ] **Step 1: Write `scraper/src/index.ts`**

```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

import { discoverCourses } from './sources/googleMaps';
import { detectBookingSoftware } from './enrichment/bookingSoftware';
import { scrapeContact } from './enrichment/contactScraper';
import { assignPriority } from './utils/priorityFlag';
import { deduplicateCourses } from './utils/dedup';
import { writeCsv, writeSummary } from './csvExport';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'output');
const ERRORS_LOG = path.join(OUTPUT_DIR, 'errors.log');

function logError(url: string, reason: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.appendFileSync(ERRORS_LOG, `[${new Date().toISOString()}] ${url} — ${reason}\n`);
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: GOOGLE_MAPS_API_KEY not set. Add to scraper/.env or root .env.local');
    process.exit(1);
  }

  console.log('Phase 1: Discovering Michigan golf courses...');
  const raw = await discoverCourses(API_KEY);
  const courses = deduplicateCourses(raw);
  console.log(`  ${courses.length} courses after dedup (${raw.length} raw)`);

  let errorCount = 0;
  console.log('\nPhase 2: Enriching (booking software + contacts)...');
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    process.stdout.write(`  [${i + 1}/${courses.length}] ${course.course_name}... `);

    if (!course.website) {
      course.booking_software = 'Manual / Phone Only';
      console.log('(no website)');
      continue;
    }

    try {
      const booking = await detectBookingSoftware(course.website);
      course.booking_software = booking.platform;
      course.golfnow_listed = booking.golfnowListed ? 'YES' : 'NO';
      if (booking.membershipGated) {
        course.notes = [course.notes, 'VERIFY: membership language detected'].filter(Boolean).join('; ');
      }
      const contact = await scrapeContact(course.website);
      Object.assign(course, {
        contact_name: contact.name,
        contact_title: contact.title,
        contact_email: contact.email,
        contact_phone: contact.phone,
      });
      console.log(booking.platform);
    } catch (err) {
      errorCount++;
      const msg = err instanceof Error ? err.message : String(err);
      logError(course.website, msg);
      course.booking_software = 'Manual / Phone Only';
      console.log(`ERROR: ${msg}`);
    }
  }

  console.log('\nPhase 3: Priority + sort...');
  for (const c of courses) c.priority = assignPriority(c.county, c.lat, c.lng);
  const tierOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, '': 3 };
  courses.sort((a, b) => {
    const d = (tierOrder[a.priority] ?? 3) - (tierOrder[b.priority] ?? 3);
    return d !== 0 ? d : a.city.localeCompare(b.city);
  });

  await writeCsv(courses);
  await writeSummary(courses, errorCount);
  console.log(`\nDone. ${courses.length} courses → scraper/output/michigan_golf_courses_outreach.csv`);
  if (errorCount > 0) console.log(`${errorCount} errors → scraper/output/errors.log`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
```

- [ ] **Step 2: Run all unit tests**

```bash
cd scraper && npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: API smoke test — verify key works**

```bash
cd scraper && node -e "
const axios = require('axios');
require('dotenv').config({ path: '../.env.local' });
const key = process.env.GOOGLE_MAPS_API_KEY;
axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
  params: { location: '42.67,-83.22', radius: '5000', type: 'golf_course', key }
}).then(r => {
  console.log('Status:', r.data.status);
  console.log('First result:', r.data.results?.[0]?.name ?? 'none');
}).catch(console.error);
"
```

Expected output:
```
Status: OK
First result: Fieldstone Golf Course  (or similar Auburn Hills course)
```

If status is `REQUEST_DENIED`: go to https://console.cloud.google.com/apis/library and enable **Places API (New)** for the project that owns this key.

- [ ] **Step 4: Run the full scraper**

```bash
cd scraper && npm start
```

Expected runtime: 15-25 minutes. Watch for `Phase 1` count — should be 300+ courses for full Michigan.

- [ ] **Step 5: Verify output**

```bash
wc -l scraper/output/michigan_golf_courses_outreach.csv
head -3 scraper/output/michigan_golf_courses_outreach.csv
cat scraper/output/scrape_summary.txt
```

Expected: CSV >50 rows, header row correct, summary shows counts by platform and tier.

- [ ] **Step 6: Commit**

```bash
git add scraper/src/index.ts
git commit -m "feat(scraper): orchestrator — full pipeline phases 1-3"
```

---

## Self-Review

**Spec coverage:** Discovery (✅ 83 centroids), private filter (✅), booking detection (✅ 8 platforms), contact scrape (✅ name/title/email/phone), priority tiers (✅), dedup (✅), CSV 14 columns (✅), summary + errors.log (✅), rate limit + UA rotation (✅).

**Type consistency:** `CourseRecord.priority` typed as `'' | 'HIGH' | 'MEDIUM' | 'LOW'` — initial value `''`, sort handles via fallback. `extractAddressComponent` strips "County" suffix; `assignPriority` receives bare county name. `BookingResult.membershipGated` read in orchestrator. All consistent.

**No placeholders:** Confirmed — all steps have runnable code or exact commands with expected output.

**Expected runtime:** 15-25 min full MI run. API cost: <$10 (within $200/mo free tier).
