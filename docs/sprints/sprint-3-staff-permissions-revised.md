# Sprint 3 — Granular Staff Permissions (revised)

This is the corrected version of the original Sprint 3 plan. The original
referenced phantom tables (`course_roles`), wrong audit-log columns, the wrong
async semantics for Next.js 16, and missed a second role source
(`crm_course_users`) plus the global-admin (`profiles.is_admin`) bypass.

Effort estimate: **4–6 days**, phased. The original "3 days" was tight.

---

## What the codebase actually looks like

| Concern | Reality |
|---|---|
| Primary role table | `public.course_admins (user_id, course_id, role)` — values `'owner' / 'manager' / 'staff'` (CHECK enforced) |
| Secondary role table | `public.crm_course_users (user_id, course_id, role)` — VARCHAR(20), defaults `'owner'`, no CHECK |
| Global admin bypass | `public.profiles.is_admin = true` |
| Page-level guard | `requireManager(slug)` in [src/lib/courseRole.ts](../../src/lib/courseRole.ts) — **redirects** to `/course/{slug}/unauthorized` on failure |
| Audit log | `public.admin_audit_log` — written via `writeAuditLog()` helper in [src/lib/audit.ts](../../src/lib/audit.ts), uses service-role client (not triggers) |
| Supabase server client | `await createClient()` — **async** (Next.js 16 + async cookies()) |
| Route params | `params: Promise<{ slug: string }>` — **also async** |
| shadcn primitives installed | badge, button, card, input, label, select, switch, tabs (no Dialog, no Sheet, no `sonner`) |
| Migration naming | Sequential 3-digit (last is `090_*`). Next is `091_*`. |

---

## Phased rollout

Do not ship this as one big bang. The risk surface (77 role-check call sites)
is too wide.

| Phase | Scope | Effort | Ships behind | Reversible? |
|---|---|---|---|---|
| A — Foundation | Migration, lookup function, app helpers, **no UI/UX changes**. Existing `requireManager` still in charge. | ~1 day | Nothing — no behavior change | Yes, drop migration + revert PR |
| B — Team page UI | Permission overrides UI as an *expand row* in existing team page. Server actions to toggle. | ~1 day | Existing `requireManager('manage_staff'-equivalent)` still works | Yes |
| C — Sensitive action gates | Migrate the call sites where role-coarseness actually hurts: `void_transaction`, `override_price`, `comp_round`, `modify_member_tier`, `delete_booking`, `export_data`. | ~1–2 days | Server enforces; UI hides | Yes (per call site) |
| D — Optional cleanup | Migrate remaining `requireManager` call sites only if the permission is meaningfully different from "is manager". Most should stay as-is. | 0–1 day | — | — |

**Do not** do a blanket search/replace of `requireManager` → `requirePermission`.
That would replace 15+ graceful redirects with thrown errors and break user UX
across the entire course portal.

---

## Pre-flight findings (ran 2026-05-24 against prod)

| Check | Result | Interpretation |
|---|---|---|
| `course_admins.role` distribution | owner: 2, manager: 1 | Matches our seed vocabulary exactly |
| `crm_course_users.role` distribution | owner: 1, staff: 3 | Both values present in our seed — safe |
| `profiles.is_admin = true` | 3 users | Global-admin bypass in the SQL function must hold for these |
| Orphans (crm_course_users with no course_admins peer) | **0** | No one is currently relying *only* on `crm_course_users` for access. Fallback in the function is defensive but not load-bearing today. |
| Total relationships | 7 (3 + 4) | Migration is essentially zero-data-risk |

**Conclusion: no migration-blocking issues.** Vocabularies match, no users
would be locked out, the global-admin bypass covers the 3 admin accounts.

One thing to confirm with Neil before Phase A: the 3 `crm_course_users` rows
with role `'staff'`. Under the revised defaults a `staff` user gets only
`view_tee_sheet`, `manage_bookings`, `check_in_golfers` — not `view_payments`
or `view_reports`. If those CRM users today expect payments/reports access
through whatever UI they use, that's a downgrade — promote them to `manager`
in `crm_course_users` (or override the relevant perms) before merging.

---

## Corrected migration: `supabase/migrations/091_staff_permissions.sql`

```sql
-- ============================================================
-- Sprint 3: Granular staff permissions (revised)
-- ============================================================

-- 1. Permission key enum
CREATE TYPE course_permission AS ENUM (
  'view_tee_sheet',
  'manage_bookings',
  'check_in_golfers',
  'view_payments',
  'void_transaction',
  'override_price',
  'comp_round',
  'modify_member_tier',
  'delete_booking',
  'view_reports',
  'export_data',
  'manage_staff',
  'manage_course_settings',
  'manage_outings'
  -- NOTE: 'send_broadcasts' removed — depends on Sprint 2 (broadcasts).
  --       Add when broadcasts ship.
);

-- 2. Per-staff permission overrides
CREATE TABLE public.staff_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  permission  course_permission NOT NULL,
  granted     BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- first set
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- last toggle
  UNIQUE (course_id, user_id, permission)
);

CREATE INDEX idx_staff_permissions_course_user
  ON public.staff_permissions (course_id, user_id);

-- Auto-bump updated_at
CREATE OR REPLACE FUNCTION public.staff_permissions_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_staff_permissions_updated_at
  BEFORE UPDATE ON public.staff_permissions
  FOR EACH ROW EXECUTE FUNCTION public.staff_permissions_touch_updated_at();

-- 3. Role-default mapping (single source of truth)
CREATE TABLE public.role_default_permissions (
  role        TEXT NOT NULL,
  permission  course_permission NOT NULL,
  PRIMARY KEY (role, permission)
);

INSERT INTO public.role_default_permissions (role, permission) VALUES
  -- owner: all 14
  ('owner', 'view_tee_sheet'),
  ('owner', 'manage_bookings'),
  ('owner', 'check_in_golfers'),
  ('owner', 'view_payments'),
  ('owner', 'void_transaction'),
  ('owner', 'override_price'),
  ('owner', 'comp_round'),
  ('owner', 'modify_member_tier'),
  ('owner', 'delete_booking'),
  ('owner', 'view_reports'),
  ('owner', 'export_data'),
  ('owner', 'manage_staff'),
  ('owner', 'manage_course_settings'),
  ('owner', 'manage_outings'),
  -- manager: 12 (no manage_staff, no manage_course_settings)
  ('manager', 'view_tee_sheet'),
  ('manager', 'manage_bookings'),
  ('manager', 'check_in_golfers'),
  ('manager', 'view_payments'),
  ('manager', 'void_transaction'),
  ('manager', 'override_price'),
  ('manager', 'comp_round'),
  ('manager', 'modify_member_tier'),
  ('manager', 'delete_booking'),
  ('manager', 'view_reports'),
  ('manager', 'export_data'),
  ('manager', 'manage_outings'),
  -- staff: 3
  ('staff', 'view_tee_sheet'),
  ('staff', 'manage_bookings'),
  ('staff', 'check_in_golfers');

-- 4. Authoritative permission check
--    Honors: global-admin bypass → course_admins → crm_course_users → overrides
CREATE OR REPLACE FUNCTION public.user_has_course_permission(
  p_user_id    UUID,
  p_course_id  UUID,
  p_permission course_permission
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin    BOOLEAN;
  v_role        TEXT;
  v_override    BOOLEAN;
BEGIN
  -- 1) Global admin: full access, ignore overrides (intentional — global
  --    admins should never lock themselves out of a course).
  SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN TRUE;
  END IF;

  -- 2) Resolve role: course_admins wins, then crm_course_users
  SELECT role INTO v_role
  FROM public.course_admins
  WHERE user_id = p_user_id AND course_id = p_course_id
  LIMIT 1;

  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM public.crm_course_users
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;
  END IF;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3) Explicit override beats role default in either direction
  SELECT granted INTO v_override
  FROM public.staff_permissions
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND permission = p_permission;

  IF FOUND THEN
    RETURN v_override;
  END IF;

  -- 4) Fall back to role default (handles unknown role values → FALSE)
  RETURN EXISTS (
    SELECT 1
    FROM public.role_default_permissions
    WHERE role = v_role
      AND permission = p_permission
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. RLS on staff_permissions
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_staff can read overrides"
  ON public.staff_permissions FOR SELECT
  USING (
    public.user_has_course_permission(auth.uid(), course_id, 'manage_staff')
  );

CREATE POLICY "manage_staff can write overrides"
  ON public.staff_permissions FOR ALL
  USING (
    public.user_has_course_permission(auth.uid(), course_id, 'manage_staff')
  )
  WITH CHECK (
    public.user_has_course_permission(auth.uid(), course_id, 'manage_staff')
  );

-- NOTE: audit log writes go through src/lib/audit.ts (writeAuditLog), not a
-- DB trigger. The codebase convention is app-level audit using the
-- service-role client. Add an 'permission_changed' event type and a
-- 'staff_permission' target type to that helper.
```

**Why no trigger for audit log?** Convention in this repo is app-level audit
via `writeAuditLog()` ([src/lib/audit.ts](../../src/lib/audit.ts)). Five
existing call sites use it. Triggers would split the truth into two places,
and the existing `admin_audit_log` INSERT policy is restricted to
`service_role` — going through `writeAuditLog()` already does that.

---

## Revised file plan

### File 1 — `src/lib/permissions.ts` (new)

Notes vs. original:
- `await createClient()` everywhere.
- `requirePermission()` **redirects**, not throws — match `requireManager` semantics.
- New `getEffectivePermissions()` reuses the lookup function rather than fetching three tables client-side.

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const COURSE_PERMISSIONS = [
  'view_tee_sheet',
  'manage_bookings',
  'check_in_golfers',
  'view_payments',
  'void_transaction',
  'override_price',
  'comp_round',
  'modify_member_tier',
  'delete_booking',
  'view_reports',
  'export_data',
  'manage_staff',
  'manage_course_settings',
  'manage_outings',
] as const

export type CoursePermission = typeof COURSE_PERMISSIONS[number]

export const PERMISSION_LABELS: Record<CoursePermission, string> = {
  view_tee_sheet:         'View tee sheet',
  manage_bookings:        'Create and edit bookings',
  check_in_golfers:       'Check in golfers (QR scan)',
  view_payments:          'View payments and revenue',
  void_transaction:       'Void or refund a transaction',
  override_price:         'Override the default rate on a booking',
  comp_round:             'Comp a round (zero charge)',
  modify_member_tier:     "Change a member's Eagle/Ace tier",
  delete_booking:         'Permanently delete a booking',
  view_reports:           'View reports dashboard',
  export_data:            'Export CSV data',
  manage_staff:           'Invite, remove, and manage staff',
  manage_course_settings: 'Edit course settings and integrations',
  manage_outings:         'Approve and manage outings',
}

/**
 * Check a single permission for a given user/course.
 * Uses the SQL function so server logic and RLS share one source of truth.
 */
export async function hasPermission(
  userId: string,
  courseId: string,
  permission: CoursePermission,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('user_has_course_permission', {
    p_user_id: userId,
    p_course_id: courseId,
    p_permission: permission,
  })
  if (error) {
    console.error('[hasPermission] rpc error', error)
    return false
  }
  return data === true
}

/**
 * Server-action / route-handler guard. Redirects to /unauthorized on failure
 * (matches requireManager semantics — don't surface a 500-level error
 * boundary for a permission denial).
 */
export async function requirePermission(
  slug: string,
  courseId: string,
  permission: CoursePermission,
): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)
  const allowed = await hasPermission(user.id, courseId, permission)
  if (!allowed) redirect(`/course/${slug}/unauthorized`)
  return { userId: user.id }
}

/**
 * Compute the full permission map for a user/course. Used to seed UI state.
 */
export async function getEffectivePermissions(
  userId: string,
  courseId: string,
): Promise<Record<CoursePermission, boolean>> {
  const admin = createAdminClient()
  const results = await Promise.all(
    COURSE_PERMISSIONS.map(async p => {
      const { data } = await admin.rpc('user_has_course_permission', {
        p_user_id: userId,
        p_course_id: courseId,
        p_permission: p,
      })
      return [p, data === true] as const
    }),
  )
  return Object.fromEntries(results) as Record<CoursePermission, boolean>
}
```

### File 2 — `src/lib/courseRole.ts` (modify)

Extend `CourseRoleContext` to include `perms`. This is what unlocks "pass
permissions from server component to children without an extra fetch."

```typescript
import type { CoursePermission } from '@/lib/permissions'
import { getEffectivePermissions } from '@/lib/permissions'

export interface CourseRoleContext {
  userId: string
  courseId: string
  role: string
  isGlobalAdmin: boolean
  isManager: boolean
  perms: Record<CoursePermission, boolean>  // NEW
}

// In resolveCourseRole(), after computing role/isManager:
const perms = await getEffectivePermissions(user.id, course.id)
return { userId: user.id, courseId: course.id, role, isGlobalAdmin, isManager, perms }
```

**Replaces the need for `/api/course/[courseId]/permissions` and
`usePermissions()` client hook entirely.** Pages and components get
`ctx.perms.void_transaction` from server props.

### File 3 — `src/app/course/[slug]/settings/team/page.tsx` (modify, **not replace**)

Keep existing table layout and components. Wrap each row's role cell with a
new `<PermissionsExpander />` that hangs off the existing `RoleSelector`.
Pass `effectivePerms` down per user so the row renders synchronously.

Server-side change: after fetching `members`, batch-fetch their effective
permissions:

```typescript
const memberIds = (members ?? []).map(m => m.user_id)
const permsByUser = Object.fromEntries(
  await Promise.all(memberIds.map(async id => [id, await getEffectivePermissions(id, courseId)])),
)
```

Then pass `permsByUser[m.user_id]` into the new expander.

### File 4 — `src/app/course/[slug]/settings/team/PermissionsExpander.tsx` (new — client)

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { COURSE_PERMISSIONS, PERMISSION_LABELS, type CoursePermission } from '@/lib/permissions'
import { togglePermissionAction } from './actions'

export default function PermissionsExpander({
  courseId,
  slug,
  userId,
  initialPerms,
}: {
  courseId: string
  slug: string
  userId: string
  initialPerms: Record<CoursePermission, boolean>
}) {
  const [open, setOpen] = useState(false)
  const [perms, setPerms] = useState(initialPerms)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(p: CoursePermission, next: boolean) {
    const prev = perms[p]
    setPerms({ ...perms, [p]: next })
    setError(null)
    startTransition(async () => {
      const res = await togglePermissionAction({ courseId, slug, userId, permission: p, granted: next })
      if (!res.ok) {
        setPerms({ ...perms, [p]: prev })
        setError(res.error)
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-xs text-[#6B7770] hover:text-[#1A1A1A]"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Permissions
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 p-3 bg-[#FAF7F2] rounded-lg ring-1 ring-black/5">
          {COURSE_PERMISSIONS.map(p => (
            <label key={p} className="flex items-center justify-between gap-2 text-xs">
              <span>{PERMISSION_LABELS[p]}</span>
              <Switch
                checked={perms[p]}
                disabled={isPending}
                onCheckedChange={next => toggle(p, next)}
              />
            </label>
          ))}
          {error && <div className="col-span-full text-xs text-red-600">{error}</div>}
        </div>
      )}
    </div>
  )
}
```

No `sonner`. Inline error matches the existing team-page style (the page has
no toast system today — adding one is out of scope).

### File 5 — `src/app/course/[slug]/settings/team/actions.ts` (new)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, type CoursePermission } from '@/lib/permissions'
import { resolveCourseRole } from '@/lib/courseRole'
import { writeAuditLog } from '@/lib/audit'

export async function togglePermissionAction(params: {
  courseId: string
  slug: string
  userId: string
  permission: CoursePermission
  granted: boolean
}) {
  try {
    const { userId: actorId } = await requirePermission(params.slug, params.courseId, 'manage_staff')

    const admin = createAdminClient()
    const { error } = await admin
      .from('staff_permissions')
      .upsert(
        {
          course_id: params.courseId,
          user_id: params.userId,
          permission: params.permission,
          granted: params.granted,
          granted_by: actorId,
        },
        { onConflict: 'course_id,user_id,permission' },
      )

    if (error) throw error

    await writeAuditLog({
      eventType: 'permission_changed',     // requires extending the union in src/lib/audit.ts
      targetType: 'staff_permission',      // requires extending the union in src/lib/audit.ts
      targetId: params.userId,
      details: {
        course_id: params.courseId,
        permission: params.permission,
        granted: params.granted,
      },
    })

    revalidatePath(`/course/${params.slug}/settings/team`)
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'unknown_error' }
  }
}
```

**Requires extending [src/lib/audit.ts](../../src/lib/audit.ts):**
- Add `'permission_changed'` to `AuditEventType`
- Add `'staff_permission'` to `AuditTargetType`

### Files to **NOT** create

- ❌ `src/lib/permissions-client.ts` (the `usePermissions()` hook). Not needed —
  perms come from the server via `resolveCourseRole`.
- ❌ `src/app/api/course/[courseId]/permissions/route.ts`. Same reason. Also
  inconsistent with the slug-keyed convention used everywhere else in
  `/course/*`.

### Phase C as actually shipped (2026-05-24)

A survey of the codebase found that most "sensitive actions" in the original
plan **don't have call sites yet**. The features either haven't been built
(refund/void via Stripe is deferred; no comp-round / price-override / member-
tier-edit / hard-delete UI exists) or are already gated upstream by
`requireManager`. The only real Phase C surface that exists today is the CSV
export button on report pages.

**Shipped:**
- `export_data` gate added to all 7 report pages
  (`reports/{rounds, revenue, comps, guests, leagues, loyalty, utilization}/page.tsx`).
  Pattern: `const ctx = await requireManager(slug)` then
  `{ctx.perms.export_data && <CsvExportButton ... />}`. Page-level
  `requireManager` left intact per the strategy.

**Deferred to the sprint that builds the feature:**

| Permission | Add the gate when this lands |
|---|---|
| `void_transaction` | A real refund action handler in `payments/` (currently refunds go through the Stripe dashboard) |
| `override_price` | The booking-edit flow that introduces manual rate override |
| `comp_round` | The booking-edit flow that lets staff mark a booking as comped (the `reports/comps/` view exists but the comp-creation action does not) |
| `modify_member_tier` | The course-portal member-tier edit UI (members page is read-only today) |
| `delete_booking` | The booking hard-delete action (no `deleteBooking*` symbol exists in the repo) |
| `manage_outings` | Outing approve/decline action |

Pattern for the deferred work, when each feature ships:

```typescript
// Server action / route handler:
await requirePermission(slug, courseId, '<perm>')

// In the page that renders the action's UI control:
{ctx.perms.<perm> && <ActionButton ... />}
```

**Do not** do a blanket `requireManager` → `requirePermission` migration on
the page-level guards. Pages guard route access (graceful redirect on
denial); per-action permissions guard mutations. The two-layer model is
intentional.

---

## Tests

### Vitest — `src/lib/permissions.test.ts`

Mock the admin client's `.rpc()` and verify:
- `hasPermission` returns `false` on RPC error
- `getEffectivePermissions` returns one entry per `COURSE_PERMISSIONS`
- `requirePermission` calls `redirect(...)` (not throws) on denial

### Vitest — `supabase/tests/staff_permissions.test.sql` (pgTAP, if used in repo) or pure SQL

- Global admin (`profiles.is_admin = true`) → all permissions TRUE, even without `course_admins` row
- User in `course_admins` with role 'staff' → defaults from `role_default_permissions`
- Override `granted=false` on a 'manager' → that permission FALSE, others still TRUE
- User only in `crm_course_users` with role 'owner' → all defaults granted

### Playwright — `tests/e2e/permissions.spec.ts`

- Owner toggles off `void_transaction` for a staff member
- Sign in as that staff, navigate to a paid booking — "Void" control hidden
- Direct POST to void action → redirects to `/unauthorized` (not 500)

---

## Acceptance criteria (revised)

- [ ] Pre-flight queries run; role vocabularies confirmed
- [ ] Migration `091_staff_permissions.sql` applies cleanly on prod
- [ ] `user_has_course_permission()` honors global-admin bypass AND `crm_course_users` fallback
- [ ] `staff_permissions` overrides beat role defaults in both directions
- [ ] `requirePermission` **redirects** on denial (does not throw)
- [ ] `resolveCourseRole` returns `perms` map; no client-side fetch needed
- [ ] Team page UI is additive — existing components preserved
- [ ] Permission changes appear in `admin_audit_log` via `writeAuditLog`
- [ ] Phase C migrated for the six sensitive actions above
- [ ] No TypeScript errors; Vitest + Playwright pass

---

## Out of scope (V1.1, unchanged from original)

- Permission groups / preset bundles
- Time-bound permissions
- "Copy from another staff member"
- IP / device restrictions
- 2FA gating for sensitive permissions

## Open questions for Neil

1. **Drop `send_broadcasts` from this sprint?** Depends on Sprint 2. Currently
   omitted from the enum — add when broadcasts ship.
2. ~~What `crm_course_users.role` values exist in prod?~~ **Resolved
   2026-05-24:** values are `'owner'` (1) and `'staff'` (3). Both covered by
   the seed. Open follow-up: do the 3 `'staff'` CRM users need
   payments/reports access today? If yes, promote them to `'manager'` or grant
   the relevant perms via override before Phase C lands.
3. **Audit visibility:** `admin_audit_log`'s SELECT policy restricts to global
   admins only. Course owners using `/settings/team` won't see their own
   permission-change history. Acceptable, or do we want a course-scoped audit
   view in Phase B?
