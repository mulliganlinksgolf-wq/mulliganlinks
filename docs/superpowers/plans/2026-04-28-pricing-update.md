# Pricing Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all site pricing to match the April 28, 2026 business decisions: $349/mo course rate, Eagle $89/yr, Ace $159/yr, restructured tier benefits, remove /about 404, waitlist course checkboxes, and fix contact email.

**Architecture:** All changes are text/config updates across ~8 files. No new routes, no DB migrations, no new components. Purely a find-and-replace-with-judgment pass across pricing constants, component copy, and form fields.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, Supabase, Resend

---

## ⚠️ ONE DISCREPANCY — NEEDS DECISION BEFORE TASK 7

The screenshot shows **4 commitment tiers** in a grid on the pricing panel:
- Standard: $349/mo
- 2-Year: $339/mo
- 3-Year: $329/mo
- 5-Year: $319/mo

The Word doc (`teeahead neil update.docx`) only defines **2 tiers**:
- Standard: $349/mo
- Annual pre-pay: $289/mo (no 2-year or 3-year mentioned)

**Task 7 below implements the 4-tier grid from the screenshot.** If you want the simpler 2-tier version from the Word doc instead, skip Task 7 entirely. Ask Billy/Neil which is correct before executing Task 7.

---

## File Map

| File | What Changes |
|------|-------------|
| `src/lib/vendorPricing.ts` | standardMonthly 299→349, standardAnnual 3588→4188 |
| `src/app/page.tsx` | Course $299→$349, Eagle $79→$89 + feature list, Ace $149→$159 + feature list, GolfPass+ comparison text, footer /about link removed |
| `src/components/SoftwareCostPage.tsx` | $299→$349 in 3 places, footer /about link removed |
| `src/components/BarterPage.tsx` | Footer /about link removed |
| `src/app/waitlist/course/page.tsx` | $299→$349 in both conditional branches |
| `src/app/waitlist/golfer/GolferWaitlistForm.tsx` | Eagle $79→$89, Ace $149→$159 (tier options + home course field → checkboxes) |
| `src/components/FoundingGolferBanner.tsx` | $79→$89 |
| `src/lib/resend.ts` | Eagle/Ace pricing + benefit copy in emails |
| `src/lib/email/sendCourseWelcome.ts` | hello@teeahead.com → support@teeahead.com |

---

## Task 1: Update the pricing constants

**Files:**
- Modify: `src/lib/vendorPricing.ts`

This is the source of truth for `TEEAHEAD_PRICING`. `SoftwareCostPage.tsx` derives `$3,588/yr` and `$299/mo` from these constants — updating here fixes the calculator panel automatically.

- [ ] **Step 1: Edit vendorPricing.ts**

```typescript
// Line 7-8 — change:
  standardMonthly: 349,
  standardAnnual: 4188,
```

- [ ] **Step 2: Verify the math**

`349 × 12 = 4188` ✓

- [ ] **Step 3: Commit**

```bash
git add src/lib/vendorPricing.ts
git commit -m "fix: update TeeAhead standard pricing to $349/mo ($4,188/yr)"
```

---

## Task 2: Fix course pricing copy in page.tsx

**Files:**
- Modify: `src/app/page.tsx` (~line 167)

- [ ] **Step 1: Update the homepage course pricing sentence**

Find (line ~167):
```
TeeAhead charges <strong className="text-[#0F3D2E] font-bold">$0</strong> for the first 10 Founding Partner courses — free for your first year. Course #11 onward pays a flat <strong className="text-[#0F3D2E] font-bold">$299/month</strong>. No barter. No commissions. No data extraction. Cancel anytime.
```

Replace `$299/month` with `$349/month`.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: update homepage course pricing copy to $349/month"
```

---

## Task 3: Fix $299 in SoftwareCostPage and course waitlist

**Files:**
- Modify: `src/components/SoftwareCostPage.tsx` (lines 141, 369)
- Modify: `src/app/waitlist/course/page.tsx` (lines 49, 53–54)

- [ ] **Step 1: SoftwareCostPage line 141**

Find:
```
                    $299 / month
```
Replace with:
```
                    $349 / month
```

- [ ] **Step 2: SoftwareCostPage line 369**

Find:
```
                          <p className="text-xs" style={{ color: 'rgba(244,241,234,0.45)' }}>$299/mo, cancel anytime</p>
```
Replace with:
```
                          <p className="text-xs" style={{ color: 'rgba(244,241,234,0.45)' }}>$349/mo, cancel anytime</p>
```

- [ ] **Step 3: Check for a third $299 reference in SoftwareCostPage**

Run:
```bash
grep -n "299" src/components/SoftwareCostPage.tsx
```

Fix any remaining instances that refer to the standard monthly rate (not vendor pricing ranges).

- [ ] **Step 4: Fix course waitlist page (both branches)**

In `src/app/waitlist/course/page.tsx` lines ~49 and ~53–54, replace both instances of `$299/month` with `$349/month`:

```tsx
// Line ~49
{allClaimed ? 'Core Partner — $349/month' : 'Founding Partners get the full platform free for your first year.'}
// Line ~53
'All 10 Founding Partner spots have been claimed. You can still join the waitlist as a Core Partner at $349/month — same software, no barter.'
// Line ~54
"The only obligation: promote the Tee Ahead membership to your golfers at the point of booking, and allow us to feature your course in our marketing. Course #11 onward pays $349/month."
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SoftwareCostPage.tsx src/app/waitlist/course/page.tsx
git commit -m "fix: update all remaining $299/month course rate references to $349/month"
```

---

## Task 4: Update Eagle tier ($79→$89, new benefit copy)

**Files:**
- Modify: `src/app/page.tsx` (lines ~295, ~406–435)
- Modify: `src/components/FoundingGolferBanner.tsx` (line 16)
- Modify: `src/app/waitlist/golfer/GolferWaitlistForm.tsx` (line 92)

**What's changing in Eagle:**
| Old | New |
|-----|-----|
| $79/yr (~$6.58/mo) | $89/yr (~$7.42/mo) |
| $10/mo in tee time credits ($120/yr) | 250 bonus Fairway Points on signup |
| 1.5× Fairway Points per dollar spent | 2× Fairway Points per dollar spent |
| 1 free round per year | 1 complimentary round/yr (course-provided, subject to availability) |
| 12 guest fee waivers per year | 1 guest pass per year |
| 10% off at participating courses | (remove — replaced by birthday credit below) |
| $25 birthday credit | 10% birthday credit |
| Footer note: "Credits applied at partner courses" | Remove |

Also update the hero bullet on ~line 295: `'Eagle membership: $79/yr, $120 in credits — beats GolfPass+ by $40'` → `'Eagle membership: $89/yr — beats GolfPass+ by $30'`

- [ ] **Step 1: Update Eagle price and monthly equivalent in page.tsx**

Lines ~406–409:
```tsx
                    <span className="font-display font-black text-4xl text-[#1A1A1A]">$89</span>
                    <span className="text-[#6B7770] text-sm">/ yr</span>
                  </div>
                  <p className="text-xs text-[#9DAA9F] mt-0.5">~$7.42/mo</p>
```

- [ ] **Step 2: Replace Eagle feature list in page.tsx**

Lines ~413–423, replace the array:
```tsx
                    {[
                      '250 bonus Fairway Points on signup',
                      '1 complimentary round/yr (course-provided, subject to availability)',
                      'Always-on booking fee waiver',
                      'Free cancellation unlimited (1hr)',
                      '2× Fairway Points per dollar spent',
                      'Priority booking: 48hr early access',
                      '1 guest pass per year',
                      '10% birthday credit',
                    ].map((f) => (
```

- [ ] **Step 3: Remove the footer note under Eagle CTA**

Delete line ~435:
```tsx
                  <p className="text-xs text-[#9DAA9F] text-center">Credits applied at partner courses</p>
```

- [ ] **Step 4: Update the hero bullet (line ~295)**

```tsx
                      'Eagle membership: $89/yr — beats GolfPass+ by $30',
```

- [ ] **Step 5: Update FoundingGolferBanner**

Line 16:
```tsx
        Founding Golfer Offer — First 100 members get 3 months of Eagle free at launch.
        Then $89/yr. Cancel anytime before.
```

- [ ] **Step 6: Update GolferWaitlistForm tier option**

Line ~92:
```tsx
            { value: 'eagle', label: 'Eagle — $89/yr (most popular)' },
```

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/FoundingGolferBanner.tsx src/app/waitlist/golfer/GolferWaitlistForm.tsx
git commit -m "fix: update Eagle to \$89/yr with new benefit structure (points, course-provided rounds)"
```

---

## Task 5: Update Ace tier ($149→$159, new benefit copy)

**Files:**
- Modify: `src/app/page.tsx` (lines ~445–461)
- Modify: `src/app/waitlist/golfer/GolferWaitlistForm.tsx` (line 93)

**What's changing in Ace:**
| Old | New |
|-----|-----|
| $149/yr (~$12.42/mo) | $159/yr (~$13.25/mo) |
| $20/mo in tee time credits ($240/yr) | 500 bonus Fairway Points on signup |
| 2× Fairway Points per dollar spent | 3× Fairway Points per dollar spent |
| 2 free rounds per year | 2 complimentary rounds/yr (course-provided, subject to availability) |
| 24 guest fee waivers per year | 2 guest passes per year |
| 15% off at participating courses | (remove — replaced by birthday credit below) |
| $50 birthday credit | 15% birthday credit |

- [ ] **Step 1: Update Ace price and monthly equivalent in page.tsx**

Lines ~445–448:
```tsx
                    <span className="font-display font-black text-4xl text-[#1A1A1A]">$159</span>
                    <span className="text-[#6B7770] text-sm">/ yr</span>
                  </div>
                  <p className="text-xs text-[#9DAA9F] mt-0.5">~$13.25/mo</p>
```

- [ ] **Step 2: Replace Ace feature list in page.tsx**

Lines ~452–461, replace the array:
```tsx
                    {[
                      '500 bonus Fairway Points on signup',
                      '2 complimentary rounds/yr (course-provided, subject to availability)',
                      'Always-on booking fee waiver',
                      'Free cancellation unlimited (1hr)',
                      '3× Fairway Points per dollar spent',
                      'Priority booking: 72hr early access',
                      '2 guest passes per year',
                      '15% birthday credit',
                    ].map((f) => (
```

- [ ] **Step 3: Update GolferWaitlistForm tier option**

Line ~93:
```tsx
            { value: 'ace', label: 'Ace — $159/yr (all-in)' },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/waitlist/golfer/GolferWaitlistForm.tsx
git commit -m "fix: update Ace to \$159/yr with new benefit structure (points, course-provided rounds)"
```

---

## Task 6: Fix email templates in resend.ts

**Files:**
- Modify: `src/lib/resend.ts`

- [ ] **Step 1: Find all Eagle/Ace pricing references**

```bash
grep -n "79\|149\|10/mo\|20/mo\|120/yr\|240/yr\|1\.5×\|2×\|credit" src/lib/resend.ts
```

- [ ] **Step 2: Update Eagle references**

For each occurrence, apply:
- `$79/yr` → `$89/yr`
- `$10/mo in tee time credits` → `250 bonus Fairway Points on signup`
- `1.5× points` → `2× points`
- Any `$120 in credits` phrasing → remove or replace with points language

Example at line ~61:
```html
        <p>Ready to earn more? Upgrade to Eagle ($89/yr) for 2× points, priority booking,
        and no booking fees. Or go Ace ($159/yr) for 3× points, 72hr early
        access, and 2 complimentary rounds/yr.</p>
```

- [ ] **Step 3: Update Ace references**

- `$149/yr` → `$159/yr`
- `$20/mo in credits` → `500 bonus Fairway Points on signup`
- `2×` → `3×` (where it refers to Ace multiplier)

- [ ] **Step 4: Update GolfPass+ comparison (line ~110)**

Find: `Eagle membership ($79/yr) beats GolfPass+ ($119/yr) on every single metric`
Replace: `Eagle membership ($89/yr) beats GolfPass+ ($119/yr) on every single metric`

- [ ] **Step 5: Commit**

```bash
git add src/lib/resend.ts
git commit -m "fix: update Eagle/Ace pricing and benefit copy in email templates"
```

---

## Task 6b: Fix contact email in sendCourseWelcome.ts

**Files:**
- Modify: `src/lib/email/sendCourseWelcome.ts` (line 21)

- [ ] **Step 1: Update FROM_EMAIL_HELLO fallback**

```typescript
  const from = process.env.FROM_EMAIL_HELLO ?? 'support@teeahead.com'
```

- [ ] **Step 2: Search for any other hardcoded hello@ addresses**

```bash
grep -rn "hello@teeahead" src/
```

Fix any remaining instances.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/sendCourseWelcome.ts
git commit -m "fix: update contact email fallback to support@teeahead.com"
```

---

## Task 7: Add commitment options grid to pricing panel (SCREENSHOT FEATURE)

> ⚠️ **Confirm with Billy first.** The Word doc only defines Standard ($349/mo) and Annual pre-pay ($289/mo). The screenshot shows 4 tiers: Standard, 2-Year ($329/mo), 3-Year ($309/mo), 5-Year ($289/mo). Get alignment before building this.

**Files:**
- Modify: `src/components/SoftwareCostPage.tsx` (after the founding/standard pricing boxes, around line 147)

- [ ] **Step 1: Add commitment options constants to vendorPricing.ts**

```typescript
export const TEEAHEAD_PRICING = {
  foundingMonthly: 0,
  foundingAnnual: 0,
  standardMonthly: 349,
  standardAnnual: 4188,
  foundingTotalSpots: 10,
  commitmentTiers: [
    { label: 'Standard', monthly: 349 },
    { label: '2-Year',   monthly: 329 },
    { label: '3-Year',   monthly: 309 },
    { label: '5-Year',   monthly: 289 },
  ],
} as const
```

- [ ] **Step 2: Add commitment grid in SoftwareCostPage.tsx**

After the closing `</div>` of the founding/standard pricing boxes (around line 147), add:

```tsx
              {/* Commitment options */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#F4F1EA]/45 tracking-[0.08em] uppercase mb-2">
                  Commitment options
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {TEEAHEAD_PRICING.commitmentTiers.map(({ label, monthly }) => (
                    <div
                      key={label}
                      className="rounded-lg p-2 text-center"
                      style={{
                        background: label === 'Standard'
                          ? 'rgba(244,241,234,0.12)'
                          : 'rgba(244,241,234,0.05)',
                        border: '1px solid rgba(244,241,234,0.1)',
                      }}
                    >
                      <p className="text-[10px] text-[#F4F1EA]/50 mb-1">{label}</p>
                      <p className="text-sm font-bold text-[#F4F1EA]">${monthly}/mo</p>
                    </div>
                  ))}
                </div>
              </div>
```

- [ ] **Step 3: Verify it renders correctly**

Start dev server and visually confirm the grid appears below the pricing boxes on the cost calculator page.

- [ ] **Step 4: Commit**

```bash
git add src/lib/vendorPricing.ts src/components/SoftwareCostPage.tsx
git commit -m "feat: add commitment options grid to pricing panel ($329/$309/$289 for 2/3/5-year)"
```

---

## Task 8: Remove /about 404 links from all footers

**Files:**
- Modify: `src/app/page.tsx` (line ~627)
- Modify: `src/components/SoftwareCostPage.tsx` (line ~601)
- Modify: `src/components/BarterPage.tsx` (line ~350)

- [ ] **Step 1: Remove About link from homepage footer**

In `src/app/page.tsx` line ~627, delete:
```tsx
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About Neil &amp; Billy</Link>
```

- [ ] **Step 2: Remove About link from SoftwareCostPage footer**

In `src/components/SoftwareCostPage.tsx` line ~601, delete the same pattern.

- [ ] **Step 3: Remove About link from BarterPage footer**

In `src/components/BarterPage.tsx` line ~350, delete the same pattern.

- [ ] **Step 4: Verify no remaining /about links**

```bash
grep -rn '"/about"' src/
```

Expected: zero results.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/SoftwareCostPage.tsx src/components/BarterPage.tsx
git commit -m "fix: remove broken /about footer links (page does not exist)"
```

---

## Task 9: Convert waitlist home course field to checkboxes

**Files:**
- Modify: `src/app/waitlist/golfer/GolferWaitlistForm.tsx` (lines ~59–62)

The `actions.ts` reads `formData.get('home_course')` — this continues to work with radio buttons since they submit a single string value. No backend change needed.

- [ ] **Step 1: Replace the Input with radio buttons**

Replace lines ~59–62 in `GolferWaitlistForm.tsx`:

```tsx
      <div className="space-y-1.5">
        <Label>Home course <span className="text-[#6B7770] font-normal">(optional)</span></Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Fox Creek',
            'Whispering Willows',
            'Idyl Wyld',
            'Other',
          ].map((course) => (
            <label
              key={course}
              className="flex items-center gap-2 rounded-lg border border-[#D4CFC5] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] cursor-pointer hover:border-[#0F3D2E]/40 has-[:checked]:border-[#0F3D2E] has-[:checked]:bg-[#0F3D2E]/5 transition-colors"
            >
              <input
                type="radio"
                name="home_course"
                value={course}
                disabled={isPending}
                className="accent-[#0F3D2E]"
              />
              {course}
            </label>
          ))}
        </div>
      </div>
```

- [ ] **Step 2: Verify form still submits correctly**

The `actions.ts` at line 11 reads `formData.get('home_course')` — radio inputs with `name="home_course"` submit the selected value identically to the text input. No change needed there.

- [ ] **Step 3: Commit**

```bash
git add src/app/waitlist/golfer/GolferWaitlistForm.tsx
git commit -m "feat: replace home course text input with course checkboxes (Fox Creek, Whispering Willows, Idyl Wyld, Other)"
```

---

## Verification Pass

After all tasks are committed:

- [ ] Run `grep -rn "299\b" src/` — should return only vendor pricing ranges (Club Caddie min $249, etc.), not TeeAhead's own rate
- [ ] Run `grep -rn "\$79\|\$149" src/` — should return zero results
- [ ] Run `grep -rn '"/about"' src/` — should return zero results
- [ ] Run `grep -rn "hello@teeahead" src/` — should return zero results
- [ ] Start dev server, check: homepage golfer tiers, cost calculator pricing, course waitlist page, golfer waitlist form
- [ ] Check comparison table in cost calculator — TeeAhead annual should now show $4,188/yr (driven by updated constant)
