# Admin Portal Redesign — Design Spec

**Date:** 2026-04-28  
**Status:** Approved  
**Author:** Neil Barris

---

## Overview

A comprehensive expansion of the TeeAhead admin portal. The existing admin has basic member management, content editing, course management, and a waitlist panel. This redesign adds member detail pages, analytics, dispute management, broadcast communications, a configuration system, and a full audit log — all organized under a new sidebar navigation layout.

---

## 1. Navigation & Layout

**Replace** the existing top navbar with a persistent left sidebar.

### Sidebar Structure

```
TeeAhead Admin
─────────────────
📊 Dashboard

Members
  👥 All Members
  ✉️  Communications

Finance
  ⚠️  Disputes  [badge: open count]

Platform
  📝 Content
  🏌️  Courses
  📋 Waitlist

Settings
  ⚙️  Configuration
  🔍 Audit Log
─────────────────
[signed in as email]
[← Member view]
```

- The **Disputes sidebar item** shows a live badge with the count of open disputes at all times.
- The **Member view** link at the bottom returns to `/app`.
- Layout: sidebar is fixed-width (~200px), main content area fills the rest.
- Existing pages (Courses, Waitlist) move into the new sidebar — no functionality removed.

---

## 2. Analytics Dashboard

Replaces the current basic stats dashboard. All metrics respect a time filter: **7d / 30d / 90d / 1yr**.

### Top Stat Cards (4)
| Metric | Description |
|--------|-------------|
| MRR | Monthly recurring revenue, with % change vs prior period |
| Total Members | Count with delta (new this period) |
| Churn Rate | % of members who cancelled, with delta |
| Avg Revenue / Member | MRR ÷ total members, with delta |

### Charts
- **MRR Growth** — bar chart, last 12 months
- **Tier Breakdown** — donut chart (Ace / Eagle / Fairway counts + percentages)
- **New Members** — line chart, last 30 days
- **Booking Volume** — line chart, last 30 days

### Recent Signups Table
Columns: Name, Email, Tier badge, Joined date, Founding member flag.

### Launch Mode Banner
Sits at the top of the dashboard (above all stats) whenever the site is in Waitlist Mode. Shows a "Go Live" button that links to Configuration.

---

## 3. Member Management

### 3a. Member List Page (`/admin/users`)

Upgrade the existing member list to show:
- Name, Email, Tier badge, Status (active/canceled/past_due), Founding member flag, Join date
- Search by name or email
- Filter by tier, status, founding member
- Click any row → opens Member Detail page

### 3b. Member Detail Page (`/admin/users/[userId]`)

**Header bar** (always visible):
- Avatar initials, full name, email, join date
- Tier badge + status badge + founding member badge
- "Edit Tier" button, "Cancel Membership" button

Clicking **"Cancel Membership"** opens a confirmation modal (not a tab scroll) with two options:
- **Cancel + Refund Now** — cancels Stripe subscription immediately, issues a pro-rated refund via Stripe, updates `memberships.status` to `canceled`.
- **Cancel at Period End** — calls Stripe to cancel at period end, sets `memberships.cancel_at_period_end = true`, member retains access until `current_period_end`. The actual period end date is shown in the modal before confirming.

**Tabbed content** (7 tabs):

#### Tab 1 — Profile
Editable fields: Full Name, Email, Phone, Home Course, Stripe Customer ID (read-only), User ID (read-only).  
Checkboxes: Founding Member, Admin Access.  
Save Changes button.

#### Tab 2 — Membership
Read-only view: current tier, status, Stripe subscription ID, Stripe customer ID, current period start/end, founding member status, date joined.

#### Tab 3 — Payments
Table of all payments associated with this member, sourced from the local database:
- **Membership charges**: read from `memberships` (stripe_customer_id, stripe_subscription_id, current_period_end) plus any charge history stored on the membership row.
- **Booking charges**: read from `bookings` where `user_id` matches.
- Columns: Date, Description (e.g. "Ace membership" or "Stonebridge Golf Club — 4 players"), Amount, Status (succeeded/refunded/disputed), Stripe charge ID (shown as a truncated reference).

#### Tab 4 — Bookings
Table from `bookings` where `user_id` matches:
- Course name, Date/time, Players, Green fee, Platform fee, Status (confirmed/canceled/no-show/completed), Paid at.

#### Tab 5 — Credits
Current balances for each credit type (monthly, birthday, free rounds) from `member_credits`.  
Manual add button: admin can add a credit with type, amount, and optional note (logged to audit log).

#### Tab 6 — Points
Fairway Points ledger from `fairway_points`: date, course, booking reference, amount, reason, running total.  
Manual adjust button: admin can add or deduct points with a reason (logged to audit log).

#### Tab 7 — Notes
Textarea for internal admin notes — not visible to the member.  
Each note is saved as a row in a new `member_admin_notes` table (member_id, admin_id, body, created_at). Displayed as a reverse-chronological timeline of past notes below the input, showing admin name and timestamp per entry.

---

## 4. Dispute Management (`/admin/disputes`)

### List View
- Filter tabs: All / Open / Under Review / Won / Lost (with counts)
- Table columns: Dispute ID, Member name, Amount, Reason, Evidence Deadline, Status, View button
- Deadline color coding:
  - Red + ⏰ icon: ≤ 3 days remaining
  - Amber: ≤ 10 days remaining  
  - Gray: > 10 days or resolved
- **Urgent alert banner** at the top when any open dispute has a deadline ≤ 3 days

### Detail Panel (inline, opens on View)
- Fields: Amount, Stripe Dispute ID, Reason, Opened date, Evidence Due date, Related charge description
- Timeline of events (dispute opened, webhook received, admin actions)
- Actions: Open in Stripe ↗, Add Note, Mark Won, Mark Lost

### Data Source
`payment_disputes` table is already populated by Stripe webhooks. The admin UI reads from this table and writes status updates back.

---

## 5. Broadcast Communications (`/admin/communications`)

### Platform Admin View
- Compose form: Subject, Body (rich text or markdown), Recipient filter (All Members / Eagle + Ace / Ace only / Eagle only / Fairway only)
- Preview recipient count before sending
- Send button → triggers email via Resend to all matching members
- Sent history table: date, subject, recipients, sender

### Course Admin View (within `/course/[slug]/`)
- Same compose UI under a new "Communications" tab in the course admin nav
- Recipients scoped to members who have at least one confirmed booking at that course
- Sent history scoped to that course

### Audit
Every broadcast is logged to the audit log with subject, recipient filter, and count.

---

## 6. Content Management (`/admin/content`)

### Layout
- Left sidebar nav organized by page group:
  - **Marketing**: Homepage, Pricing / Tiers, GolfNow Alternative, How Barter Works, Software Cost
  - **Waitlist**: Golfer Signup, Course Signup
  - **Site-wide**: Nav & Footer, Contact Info
  - **Legal**: Privacy Policy, Terms of Service
- Selecting a page shows all content blocks for that page in an editor panel
- "View live page ↗" link in the panel header

### Content Block Editor
Each block shows:
- Label (human-readable name)
- Type badge: `text`, `markdown`, or `html`
- Input: single-line for `text`, textarea for `markdown`/`html`
- Footer: database key, last edited by + timestamp

**+ Add new content block** button at the bottom of each page panel — opens a modal to name the block, set its type, and assign it a key. The component using that key must be added to the page component separately, but the block itself can be pre-created.

**Publish Changes** button saves all edits and calls `revalidatePath` on the relevant routes.

### Database
All content stored in the existing `content_blocks` table. New blocks are inserted as new rows. No schema changes needed — only new seed rows.

### Implementation note
Site components that currently have hardcoded strings should be refactored to read from `content_blocks` by key, with the hardcoded value as a fallback default.

---

## 7. Configuration (`/admin/config`)

All config stored in a new `site_config` table (key/value with type and description columns, similar structure to `content_blocks`). Changes are saved immediately and reflected site-wide via server-side reads.

### Sections

#### Launch Mode
- **Site Mode toggle** (large, prominent): Waitlist Mode ↔ Live Mode
  - Waitlist Mode: public sees coming-soon page, bookings and membership signups disabled
  - Live Mode: full member-facing product active
- Metro Area Name (text input) — shown throughout the site
- Founding Golfer Cap (number input) — max founding spots

#### Membership Pricing Display
- Fairway price display (free, but configurable label)
- Eagle annual price ($/yr)
- Ace annual price ($/yr)
- Eagle monthly credit value ($)
- Ace monthly credit value ($)

> **Note:** These are display values only. Stripe product prices are managed in the Stripe dashboard.

#### Platform Fees
- Fairway tier per-booking fee ($)
- Eagle / Ace per-booking fee ($ — expected to remain $0.00)

> Fee changes here update the live fee calculation in `src/lib/stripe/fees.ts` values read from the database. A migration will make fees DB-driven rather than hardcoded.

#### Feature Flags
| Flag | Description |
|------|-------------|
| Golfer Waitlist | Show/hide the golfer waitlist signup form |
| Course Partner Waitlist | Show/hide the course partner application |
| Membership Signups | Enable/disable new membership checkout |
| Tee Time Bookings | Enable/disable tee time booking for members |

All feature flag reads are server-side so toggling takes effect immediately with no deploy.

---

## 8. Audit Log (`/admin/audit`)

### What Gets Logged
Every admin action writes a row to a new `admin_audit_log` table:

| Event Type | Example |
|------------|---------|
| `membership_cancelled` | Member John Doe — Ace → Cancelled |
| `refund_issued` | $159.00 pro-rated refund for John Doe |
| `tier_changed` | Sarah K. Eagle → Ace (manual override) |
| `member_created` | mike.t@icloud.com, Eagle tier |
| `member_deleted` | user deleted |
| `credit_added` | +$10 manual credit for John Doe |
| `points_adjusted` | +500 points for John Doe — courtesy adjustment |
| `config_changed` | Platform fee: $1.49 → $1.99 |
| `content_edited` | home.headline changed |
| `dispute_updated` | Dispute #D-1028 marked Won |
| `email_sent` | Broadcast to 49 Eagle + Ace members |
| `admin_note_added` | Note added to John Doe's profile |

### Log Schema (`admin_audit_log`)
```sql
id          uuid PRIMARY KEY
created_at  timestamptz DEFAULT now()
admin_id    uuid REFERENCES auth.users(id)
admin_email text
event_type  text
target_type text  -- 'member', 'config', 'content', 'dispute', 'communication'
target_id   text  -- user id, config key, dispute id, etc.
target_label text -- human-readable name of the target
details     jsonb -- before/after values, amounts, reasons, etc.
```

### List View
- Search by member name/email or admin name
- Filter by: action type, admin, time range (7d / 30d / all time)
- Table: Action tag (color-coded), Details (with before/after), Admin name, Timestamp
- Paginated (25 per page)
- Admin names derived from `profiles.full_name` for the acting admin

---

## 9. Database Changes Required

| Change | Details |
|--------|---------|
| New table: `site_config` | Key/value config store for launch mode, pricing display, fees, feature flags |
| New table: `admin_audit_log` | Audit trail for all admin actions |
| New column: `memberships.cancel_at_period_end` | Boolean for scheduled cancellations |
| New table: `member_admin_notes` | Internal notes per member — columns: id, member_id, admin_id, body, created_at |
| New `content_blocks` rows | Seed new blocks for all pages listed in Content Management |
| `src/lib/stripe/fees.ts` | Make platform fees DB-driven (read from `site_config`) |

---

## 10. Out of Scope

- Booking refunds — handled by course admins within the course admin portal, not platform admin
- Stripe dashboard replacement — dispute evidence submission remains in Stripe; admin links to Stripe for that action
- Course payout management — out of scope for this iteration
- Member-facing communications preferences / unsubscribe flow — not part of this spec

---

## 11. Testing Requirements

Every feature must be tested as it is built — not after. The project uses Vitest (unit/integration) and Playwright (E2E).

- **Server actions and API routes**: Vitest unit tests covering the happy path, error cases, and any Stripe interactions (mocked via `vi.mock`).
- **Admin UI pages**: Playwright E2E tests covering the key user flows — e.g., cancel + refund a member, edit a content block, toggle a feature flag, view a dispute.
- **Database migrations**: Each new migration must be tested against a local Supabase instance before merging.
- **Audit log**: Every new admin action type must have a test asserting that a log entry is written with the correct `event_type` and `details`.
- **Feature flags**: Tests must assert that toggling a flag (e.g., disabling bookings) actually blocks the relevant action site-wide.

No feature is considered done until its tests pass.

---

## 12. Key Constraints

- All admin routes are protected by the existing admin auth check in `/src/app/admin/layout.tsx` (email allowlist + `profiles.is_admin` flag). No changes needed to the auth model.
- Content block changes must call `revalidatePath` to bust Next.js cache and reflect on the live site immediately.
- Config changes (especially launch mode and feature flags) must be read server-side on every request — not cached — so they take effect without a deploy.
- Audit log writes must be non-blocking; a failed audit write should not fail the underlying admin action.
- Membership cancellation and refund flows must call Stripe first, then update the database — never the reverse, to prevent inconsistent state.
