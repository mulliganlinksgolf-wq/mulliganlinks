# Course Portal Role-Based Access Control

**Date:** 2026-05-01
**Status:** Approved

## Overview

Enforce the existing `course_admins` role enum (`owner`, `manager`, `staff`) throughout the `/course/[slug]/` portal, and give owners/managers a self-serve UI to invite and remove staff members.

## Roles and Access

| Page | Owner | Manager | Staff |
|---|---|---|---|
| Tee Sheet | ✅ | ✅ | ✅ |
| Check-in | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ |
| Members | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ❌ |
| Billing | ✅ | ✅ | ❌ |
| Settings (incl. Team) | ✅ | ✅ | ❌ |

Owner and manager are functionally identical. The distinction is a label only at this stage.

## Architecture

### 1. Access Enforcement (`layout.tsx`)

Add a `ROUTE_ROLES` constant mapping each nav segment to the minimum set of roles allowed:

```ts
const ROUTE_ROLES: Record<string, string[]> = {
  'check-in':  ['owner', 'manager', 'staff'],
  'bookings':  ['owner', 'manager', 'staff'],
  'members':   ['owner', 'manager', 'staff'],
  'payments':  ['owner', 'manager'],
  'reports':   ['owner', 'manager'],
  'dashboard': ['owner', 'manager'],
  'billing':   ['owner', 'manager'],
  'settings':  ['owner', 'manager'],
}
// default (tee sheet / root) allows all roles
```

The layout already resolves `role` from `course_admins` on every request. After resolving the role, derive the current path segment from `slug` and check it against `ROUTE_ROLES`. If the role is not in the allowed list, redirect to `/course/[slug]/unauthorized`.

Nav items are filtered to only render items the resolved role can access, so restricted tabs are never shown to staff.

### 2. Unauthorized Page (`/course/[slug]/unauthorized/page.tsx`)

Simple server component. Displays a clear "You don't have access to this section" message with a link back to the tee sheet (the staff home page). No sensitive information.

### 3. Team Management (`/course/[slug]/settings/team/`)

A new sub-page within Settings, accessible to owner and manager only (enforced by the layout rule above).

**`page.tsx`** (server component):
- Fetches all `course_admins` rows for this course, joined to `profiles_with_email` for name/email
- Renders a table: Name, Email, Role, Date Added, Remove button
- Renders the `InviteStaffModal` client component

**`InviteStaffModal.tsx`** (client component):
- Email input field, submit button
- Calls the `inviteStaff` server action
- Shows success ("Invite sent to email@example.com") or error inline
- Closes on success after a short delay

### 4. Server Actions (`src/lib/actions/courseTeam.ts`)

**`inviteStaff(email: string, courseId: string, slug: string): Promise<void>`**
1. Validate caller is owner or manager of the course (via `createClient()` + `course_admins` check)
2. Call `adminClient.auth.admin.inviteUserByEmail(email, { redirectTo: https://teeahead.com/course/[slug] })` — Supabase sends the setup email. `slug` is passed as a parameter so no extra DB query is needed to construct the URL.
3. Upsert into `course_admins`: `{ user_id: returnedUser.id, course_id, role: 'staff' }` — uses `ON CONFLICT (user_id, course_id) DO NOTHING` so existing members aren't downgraded
4. `revalidatePath('/course/[slug]/settings/team')`

**`removeStaff(userId: string, courseId: string, slug: string): Promise<void>`**
1. Validate caller is owner or manager
2. Delete the `course_admins` row where `user_id = userId AND course_id = courseId`
3. Does not delete the auth user — only removes portal access for this course
4. `revalidatePath('/course/[slug]/settings/team')`

## Database

No schema changes required. `course_admins` already has:
- `user_id UUID` — set at invite time from the Supabase response
- `course_id UUID`
- `role TEXT CHECK (role IN ('owner','manager','staff'))`
- `created_at TIMESTAMPTZ`
- `UNIQUE(user_id, course_id)`

## New Files

| File | Purpose |
|---|---|
| `src/app/course/[slug]/unauthorized/page.tsx` | Access-denied page |
| `src/app/course/[slug]/settings/team/page.tsx` | Team management table |
| `src/app/course/[slug]/settings/team/InviteStaffModal.tsx` | Invite modal (client) |
| `src/lib/actions/courseTeam.ts` | inviteStaff + removeStaff server actions |

## Modified Files

| File | Change |
|---|---|
| `src/app/course/[slug]/layout.tsx` | Add `ROUTE_ROLES` map, path check, filtered nav |

## Out of Scope

- Changing an existing member's role (edit role UI)
- Removal notifications (email when removed)
- `crm_course_users` permissions — separate system
- Global TeeAhead admin (`profiles.is_admin`) bypasses all of this as before
