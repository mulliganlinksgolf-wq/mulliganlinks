# Spec: April 2026 Audit Changes

**Date:** 2026-04-30
**Scope:** Six areas of copy, UX, and bug fixes across the public marketing site. No homepage changes. No admin/app changes.

---

## Section 1 — Golfer Waitlist

**Files:** `src/app/waitlist/golfer/page.tsx`, `src/app/waitlist/golfer/TierPicker.tsx`, `src/app/waitlist/golfer/GolferWaitlistForm.tsx`

### 1a. Tier multiplier corrections

The current multipliers are wrong and need updating everywhere they appear — in the `tiers` array in `page.tsx` (passed to `TierPicker`) and in any hardcoded references inside `TierPicker.tsx`.

| Tier | Current | Correct |
|------|---------|---------|
| Eagle | 2× Fairway Points | 1.5× Fairway Points |
| Ace | 3× Fairway Points | 2× Fairway Points |

### 1b. Fine print below tier cards

Add a small italicised fine print line below the tier picker cards in `TierPicker.tsx`:

> *Each course varies on how they would like to promote their deals.*

Style: `text-xs text-[#9DAA9F] text-center mt-4 italic`

### 1c. Golfer waitlist form — flatten optional section

`GolferWaitlistForm.tsx` currently hides optional fields behind a collapsible accordion. This is confusing because it looks like the form only submits the top portion.

**Changes:**
- Remove the accordion toggle entirely.
- Render all optional fields inline below the submit button, always visible, with a simple section label (e.g., `"Optional — help us personalize your experience"`).
- Move **Last name** out of the optional block. It should appear immediately after First name in the main required section, but not marked as required (no asterisk, no `required` attribute).

---

## Section 2 — Course Waitlist

**Files:** `src/app/waitlist/course/page.tsx`, `src/app/waitlist/course/GolfNowCountdown.tsx`, `src/app/waitlist/course/CourseWaitlistForm.tsx`

### 2a. Copy fix — "Live within 48 hours"

In `page.tsx`, the green benefit card for "Live in 48 hours" should read **"Live within 48 hours"**. Check all instances of this phrase on this page and correct them.

### 2b. Multi-year pricing note

In the pricing strip section on the course waitlist page (`page.tsx`), add a note beneath the `$349/mo` standard pricing card:

> *Multi-year contracts available at a discount — ask Neil.*

Style: `text-xs text-[#9DAA9F] mt-1`

This is intentionally vague — no hard discount number until confirmed.

### 2c. GolfNow countdown → form auto-fill

**Current behavior:** `GolfNowCountdown` manages its own `expiryDate` state internally. `CourseWaitlistForm` has a separate `contract_expiry_date` date input. The two are disconnected.

**Desired behavior:** When a user enters a date in the countdown widget, the same date automatically populates the `contract_expiry_date` field in the form below.

**Implementation:**
1. Lift `expiryDate` state from `GolfNowCountdown` up to the parent page (`page.tsx` — but this is a server component, so the state needs to live in a new thin client wrapper).
2. Create a `CourseWaitlistSection` client component in `src/app/waitlist/course/` that holds `expiryDate` state and renders both `GolfNowCountdown` and `CourseWaitlistForm` as siblings, passing `expiryDate` down.
3. `GolfNowCountdown` receives `expiryDate` and `onExpiryChange` as props instead of managing its own state.
4. `CourseWaitlistForm` receives `prefillExpiryDate?: string` prop and uses it as the `defaultValue` on the `contract_expiry_date` input.

---

## Section 3 — Barter Calculator Mobile Fix

**File:** `src/components/BarterPage.tsx`

**Root cause:** The page uses three `<input type="range">` sliders (green fee, operating days, barter tee times). On mobile, touch events on a slider are intercepted by the browser's scroll handler, causing the page to scroll while the user tries to drag the slider — a jarring visual glitch.

**Fix:** Add `style={{ touchAction: 'none' }}` to each `<input type="range">` element. This tells the browser not to use the touch gesture for scrolling when the user is interacting with the slider, eliminating the conflict. No layout changes needed.

---

## Section 4 — FAQ

**File:** `src/components/HomepageFaq.tsx`

### 4a. Question 1 — wording

Change:
> "Is TeeAhead really free for courses?"

To:
> "Is TeeAhead really free for courses for founding partners?"

The answer body stays the same.

### 4b. Question 3 — add Billy's email

The current answer to "What if my course already uses EZLinks, foreUP, or another system?" references only `neil@teeahead.com`. Add `billy@teeahead.com` so both founders are listed as contacts.

Updated answer ending:
> "…Email Neil or Billy directly at neil@teeahead.com or billy@teeahead.com — they'll give you a straight answer about your specific setup."

---

## Section 5 — Founders Scorecard

**File:** `src/components/FoundersScorecard.tsx`

### 5a. Hole 4 — The Why

Change the notes content to:
> "We're just like every other golfer that wants something more reasonable and innovative."

### 5b. Hole 5 — The Ask

Remove the "If you're a golfer who feels the same way — billy@teeahead.com" sentence.

Replace Hole 5 notes with:
> "If you run a course in Metro Detroit, reach out to Neil or Billy directly — neil@teeahead.com or billy@teeahead.com."

---

## Section 6 — Footer + Contact Link

**Files:** All pages with a footer (homepage `page.tsx`, `waitlist/course/page.tsx`, `waitlist/golfer/page.tsx` — any page that renders the footer inline)

### 6a. Contact link

The footer currently links "Contact" to `mailto:support@teeahead.com`. Change it to `<Link href="/contact">` — the `/contact` page already exists with a full inquiry form.

### 6b. Product column reorganisation

Current footer Product column:
- For Golfers
- For Courses
- Barter Calculator
- GolfNow Damage Report
- Pricing
- Software Cost Calculator

New structure:
- **For Golfers** → links to `/waitlist/golfer`
  - Pricing (indented sub-link, or just one link for the section)
- **For Courses** → links to `/waitlist/course`
  - Barter Calculator
  - GolfNow Damage Report
  - Software Cost Calculator

Visually: group the tool links under "For Courses" using a small indent or separator, keeping the column readable. The simplest approach is a flat list with "For Golfers" and "For Courses" as section labels (slightly bolder/uppercase), and the tools indented below "For Courses".

---

## Out of Scope

- Homepage changes (deferred)
- Fairway promotion benefit (removed)
- Multi-course Eagle/Ace discount (deferred)
- Any admin portal, app portal, or database changes
