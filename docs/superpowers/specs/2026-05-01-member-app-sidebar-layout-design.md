# Member App Sidebar Layout Design

> **For agentic workers:** After reviewing this spec, invoke `superpowers:writing-plans` to create the implementation plan.

**Goal:** Replace the top nav + cream background with a dark green sidebar layout that eliminates whitespace and makes the app feel cohesive.

**The problem:** The current `/app` shell uses a white top nav and cream (`#FAF7F2`) background. Each page renders a single dark green card floating on that cream canvas, leaving large empty margins on wide screens. The user wants the whole experience to feel like an app, not a marketing site with a portal section bolted on.

**Design decisions made:**
- Layout: Persistent left sidebar (desktop), bottom tab bar (mobile)
- Sidebar content: Logo + labeled nav links + sign out
- Content background: Always dark (`#0f2d1d`) — no light mode for now
- Mobile nav: Bottom tab bar (5 tabs, thumb-friendly)

---

## Architecture

### Shell Layout

`app/app/layout.tsx` becomes a full-height flex row:

```
┌─────────────────────────────────────────┐
│  AppSidebar (224px, desktop only)       │  ← hidden below md
│  ─────────────────────────────────────  │
│  Logo                                   │
│  Dashboard   ← active                  │
│  Courses                                │
│  Bookings                               │
│  Points                                 │
│  My Card                                │
│  Profile                                │
│  ─────────────────────────────────────  │
│  Sign out                               │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  <main> (flex-1, bg-[#0f2d1d])         │
│  overflow-y-auto, px-8 py-8            │
│  {children}                             │
└─────────────────────────────────────────┘

Mobile (below md):
┌─────────────────────────────────────────┐
│  <main> full width, bg-[#0f2d1d]       │
│  pb-20 (space for bottom nav)           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  AppBottomNav (fixed bottom, 5 tabs)   │
└─────────────────────────────────────────┘
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/AppNav.tsx` | Delete — replaced by the two components below |
| `src/components/AppSidebar.tsx` | Create — desktop sidebar |
| `src/components/AppBottomNav.tsx` | Create — mobile bottom tab bar |
| `src/app/app/layout.tsx` | Rewrite to flex-row shell, dark bg |
| `src/app/app/page.tsx` | Remove outer card wrapper |
| `src/app/app/courses/page.tsx` | Remove outer card wrapper, inline header |
| `src/app/app/bookings/page.tsx` | Remove outer card wrapper, inline header |
| `src/app/app/points/page.tsx` | Remove outer card wrapper, inline header |
| `src/app/app/card/page.tsx` | Remove outer card wrapper (page liked as-is, inner card stays) |
| `src/app/app/profile/page.tsx` | Remove outer card wrapper, wrap ProfileForm in `bg-[#1B4332]` card |
| `src/app/app/membership/page.tsx` | Remove outer card wrapper, inline header |

---

## Component Specs

### `AppSidebar.tsx`

```
'use client'
- Uses usePathname for active state
- Hidden below md: className="hidden md:flex"
- Width: w-56 (224px)
- Background: bg-[#1B4332]
- Border: border-r border-[#0f2d1d]
- Layout: flex-col, h-full, fixed (position: fixed, top-0, left-0, bottom-0)
```

**Structure:**
```
<aside class="hidden md:flex flex-col w-56 fixed top-0 left-0 bottom-0 bg-[#1B4332] border-r border-[#0f2d1d]">
  <div class="p-5 border-b border-[#0f2d1d]">
    <TeeAheadLogo />
    {/* TeeAheadLogo is a PNG — check if it reads on dark bg.
        If not (e.g. dark text on transparent), replace with a
        white/gold text wordmark: className="h-8 w-auto brightness-0 invert"
        or a dedicated logo-light.png variant */}
  </div>
  <nav class="flex-1 p-3 space-y-1">
    {navItems.map(item => <NavLink ... />)}
  </nav>
  <div class="p-3 border-t border-[#0f2d1d]">
    <form action="/api/auth/logout" method="post">
      <button>Sign out</button>
    </form>
  </div>
</aside>
```

**Nav link active/inactive styles:**
- Active: `bg-white/10 text-white font-semibold`
- Inactive: `text-[#8FA889] hover:text-white hover:bg-white/5`
- Each link: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium`

**Nav items (in order):**
```
{ href: '/app',          label: 'Dashboard', icon: '⛳', exact: true }
{ href: '/app/courses',  label: 'Courses',   icon: '🗺️' }
{ href: '/app/bookings', label: 'Bookings',  icon: '📋' }
{ href: '/app/points',   label: 'Points',    icon: '⭐' }
{ href: '/app/card',     label: 'My Card',   icon: '🃏' }
{ href: '/app/profile',  label: 'Profile',   icon: '👤' }
```

### `AppBottomNav.tsx`

```
'use client'
- Uses usePathname for active state
- Visible only below md: className="md:hidden"
- Fixed to bottom: fixed bottom-0 left-0 right-0
- Background: bg-[#1B4332]
- Border: border-t border-[#0f2d1d]
- Height: ~56px (py-2)
```

**5 tabs (My Card omitted — merges into Profile on mobile):**
```
{ href: '/app',          label: 'Home',     icon: '⛳', exact: true }
{ href: '/app/courses',  label: 'Courses',  icon: '🗺️' }
{ href: '/app/bookings', label: 'Bookings', icon: '📋' }
{ href: '/app/points',   label: 'Points',   icon: '⭐' }
{ href: '/app/profile',  label: 'Profile',  icon: '👤' }
```

**Tab styles:**
- Active: `text-white`
- Inactive: `text-[#8FA889]`
- Each tab: `flex flex-col items-center gap-0.5 text-[10px] font-medium`

### `app/app/layout.tsx`

```tsx
export default async function AppLayout({ children }) {
  // auth check (unchanged)
  return (
    <div className="flex h-screen bg-[#0f2d1d] overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto md:pl-56">
        {/* md:pl-56 offsets the fixed sidebar — sidebar is hidden on mobile so no offset needed */}
        <div className="px-8 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <AppBottomNav />
    </div>
  )
}
```

---

## Page Changes

Each page currently wraps everything in `<div className="rounded-xl overflow-hidden">` with an inner dark header block. This outer wrapper is removed — the dark background is now the layout itself.

### Pattern: Before → After

**Before:**
```tsx
<div className="rounded-xl overflow-hidden">
  <div className="px-5 py-5" style={{ background: '#1B4332' }}>
    <p className="text-[9px] uppercase ...">Section Label</p>
    <h1 className="text-2xl font-bold font-serif text-white italic">Page title.</h1>
    <p style={{ color: '#8FA889' }}>Subtitle</p>
  </div>
  <div style={{ background: '#163d2a' }}>
    {/* content */}
  </div>
</div>
```

**After:**
```tsx
<div>
  <div className="mb-6">
    <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">Section Label</p>
    <h1 className="text-2xl font-bold font-serif text-white italic">Page title.</h1>
    <p className="text-[11px] font-sans mt-1 text-[#8FA889]">Subtitle</p>
  </div>
  <div className="rounded-xl overflow-hidden" style={{ background: '#1B4332' }}>
    {/* content sections */}
  </div>
</div>
```

The heading becomes inline text on the dark bg. Content sections become individual rounded cards within the page.

### Per-page specifics

**Dashboard (`/app`):** Round Card component stays as-is — it's a product UI element, not just a layout container. Just remove the outer page wrapper if one exists.

**Courses (`/app/courses`):** Inline header → course grid renders as a rounded card `bg-[#1B4332]` with the existing course cards inside.

**Bookings (`/app/bookings`):** Inline header → booking list renders as a rounded card with the existing row pattern.

**Points (`/app/points`):** Inline header with the stats (balance, credit, earn rate) → transaction history as a rounded card below.

**My Card (`/app/card`):** Inner physical card design is unchanged. Just remove the outer wrapper.

**Profile (`/app/profile`):** Inline header → `ProfileForm` wrapped in `<div className="rounded-xl p-6 bg-[#1B4332]">` so the light form fields don't sit raw on the dark bg.

**Membership (`/app/membership`):** Inline header → `FoundingGolferBanner` → tier cards grid (already styled, just remove outer wrapper).

---

## What Does Not Change

- All data fetching (Supabase queries in each page)
- `RoundCard` and `ScorecardRows` components
- `ProfileForm` component
- `FoundingGolferBanner` component
- `MembershipPage` tier card styles
- Auth flow (`createClient`, redirect logic)
- All API routes

---

## Color Reference

| Token | Hex | Used for |
|-------|-----|----------|
| Brand green | `#1B4332` | Sidebar, card backgrounds, section headers |
| Deep green | `#0f2d1d` | Content area background, dividers |
| Surface green | `#163d2a` | Row backgrounds, stats strip |
| Sage | `#8FA889` | Inactive nav, subtitles |
| Gold | `#E0A800` | Logo, Eagle tier, highlights |
| White | `#ffffff` | Active nav, primary text |
| Muted | `#aaa` | Labels, small caps text |
