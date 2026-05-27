# CRM Email Enhancements Design

**Date:** 2026-05-11  
**Status:** Approved  

## Overview

Three enhancements to the admin CRM email system:

1. **Per-sender identity** — emails send from `neil@teeahead.com` or `billy@teeahead.com` based on who's logged in, with a personal signature per admin
2. **Open tracking** — Resend webhooks update the activity log when an email is opened; "Opened" badge appears on activity entries; email performance dashboard shows aggregate stats
3. **Bulk CSV import** — two-step upload flow to create `crm_courses` records from a CSV file

---

## Section 1: Database Changes

One migration adds the following columns to `crm_activity_log`:

| Column | Type | Description |
|---|---|---|
| `resend_email_id` | `text` | Message ID returned by Resend at send time; used to match webhook events |
| `opened_at` | `timestamptz` | Timestamp of first open; null until Resend fires `email.opened` |
| `open_count` | `integer` | Incremented on every open event (including re-opens); default 0 |
| `from_email` | `text` | Sender address used (`neil@teeahead.com`, `billy@teeahead.com`, or `hello@teeahead.com`) |

One migration adds a `signature` column to the admin user record (either `profiles` or a new `admin_profiles` table — determined during implementation by inspecting the existing schema).

| Column | Type | Description |
|---|---|---|
| `signature` | `text` | Plain-text email signature; null if not set |

All changes are additive. No existing columns modified.

---

## Section 2: Per-Sender Identity

### Sender mapping

A config object in the CRM email action maps admin auth email → sending address:

```
nbarris11@gmail.com  →  neil@teeahead.com
beslock@yahoo.com    →  billy@teeahead.com
(any other admin)    →  hello@teeahead.com
```

Both `neil@` and `billy@` are already verified senders on the Resend account. No Resend config changes needed.

### At send time

- Read the logged-in user's email from the session
- Resolve to the appropriate `from` address using the mapping above
- Pass `from` to `resend.emails.send()`
- Store the resolved address in `crm_activity_log.from_email`
- Store the returned Resend message ID in `crm_activity_log.resend_email_id`

### Email signatures

- Each admin sets their signature at `/admin/settings` (new "Email Signature" section, simple textarea)
- Signature is loaded from DB at send time and appended to the email body below the message, separated by a line break and `--`
- The CRM email composer shows the signature in the preview area below the body so the sender can see the final output before sending
- If no signature is set, nothing is appended

---

## Section 3: Open Tracking via Resend Webhooks

### Resend setup (manual, ~2 min)

In the Resend dashboard: create a webhook pointing to `https://teeahead.com/api/webhooks/resend`, subscribe to the `email.opened` event only. Copy the signing secret into `RESEND_WEBHOOK_SECRET` env var.

### Webhook route

New public route: `POST /api/webhooks/resend`

1. Validate the `svix-signature` header using `RESEND_WEBHOOK_SECRET` — reject with 400 if invalid
2. Parse the event; ignore anything that isn't `email.opened`
3. Look up `crm_activity_log` by `resend_email_id` matching `data.email_id`
4. If found and `opened_at` is null: set `opened_at = data.created_at`
5. Always increment `open_count`
6. Return 200 immediately

If no matching activity row is found (e.g. a transactional email unrelated to CRM), return 200 silently — no error.

### Activity log UI

Email-type activity entries get a small "Opened" badge (green pill) when `opened_at` is not null. If `open_count > 1`, the badge reads "Opened ×3" (or whatever the count is). Badge appears inline next to the activity timestamp.

---

## Section 4: Bulk CSV Import

### Route

New page: `/admin/crm/import`

### Step 1 — Upload

- Drag-and-drop zone or click-to-browse for `.csv` files
- On file selection, parse client-side and show a preview table of the first 5 rows
- Show detected column headers

### Step 2 — Map & Import

Column mapper: CSV headers on the left, dropdown on the right mapping to CRM fields:

| CRM field | Required | Notes |
|---|---|---|
| Course name | Yes | |
| Contact name | No | |
| Contact email | No | |
| Contact phone | No | |
| Pipeline stage | No | Defaults to `lead` if blank or unrecognized value |
| Assigned to | No | Accepts `neil` or `billy`; defaults to logged-in user |
| Notes | No | |

"Import X courses" button (X = number of valid rows after deduplication preview).

### Import logic (server action)

1. Parse and validate each row — skip rows missing course name
2. Deduplicate against existing `crm_courses` by `contact_email` — skip matches
3. Insert valid rows into `crm_courses`
4. Return a results summary: `{ created: N, skipped: N, errors: [...] }`

### Results view

After import completes, show a summary card:
- "X courses created"
- "Y skipped (already exist)"
- Any row-level errors listed (e.g. "Row 4: invalid stage value 'prospect'")

No redirect — user stays on the import page and can run another import.

---

## Section 5: Email Performance Dashboard

### Route

New page: `/admin/crm/email-performance`

### Overview cards (top row)

- Total emails sent (all time)
- Total emails sent (last 30 days)
- Overall open rate % (all time)
- Neil's open rate vs Billy's open rate (side-by-side)

### By template table

Columns: Template name | Times sent | Times opened | Open rate % | Last sent  
Sorted by times sent descending. Pulls from `crm_activity_log` joined to `crm_email_templates` by matching subject line (or template ID if one is stored on the activity — check during implementation).

### By contact type table

Columns: Record type | Emails sent | Open rate %  
Rows: Courses | Outings | Members  
Sourced from `crm_activity_log.record_type`.

### Data source

All three views query `crm_activity_log` directly — no separate analytics table. Server component with no client-side fetching needed.

---

## Out of Scope

- Click tracking (not building custom link rewriting; Resend handles clicks separately if needed later)
- Reply sync / IMAP inbox sync (not needed — Neil and Billy read replies in their own inboxes)
- Multi-step drip campaigns
- Unsubscribe management
- Attachment support

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `RESEND_WEBHOOK_SECRET` | Signing secret from Resend webhook dashboard |

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` already exist.

---

## Testing Notes

- Webhook route must be tested with a real Resend send (not a mock) since signature validation requires the actual secret
- Bulk import should be tested with the existing `michigan_golf_courses_outreach.csv` in the repo
- Performance dashboard can be verified by sending a test email from each sender and confirming the by-sender breakdown updates
