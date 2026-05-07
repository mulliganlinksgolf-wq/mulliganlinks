# Social Media Manager — Design Spec

**Date:** 2026-05-06  
**Feature:** `/admin/social` — Buffer-connected social scheduling with AI captions  
**Author:** Neil Barris / Claude

---

## Overview

A single admin page that connects to Buffer's GraphQL API to compose, schedule, and manage TeeAhead social posts across Instagram, Facebook, LinkedIn, and Twitter/X — with an Anthropic-powered caption generator using TeeAhead's brand voice system prompt, and a Canva link-out for image design with local preview.

**Scope:** Admin-only (super-admin gate). No new Supabase tables. No OAuth. No Canva API. No image hosting — preview only in this phase.

---

## Architecture

### New files

| File | Type | Purpose |
|------|------|---------|
| `src/lib/buffer.ts` | Library | Typed GraphQL client for Buffer API |
| `src/app/api/social/upload-image/route.ts` | API route | Image → base64 dataUrl preview |
| `src/app/api/social/generate-caption/route.ts` | API route | Anthropic caption generation |
| `src/app/admin/social/actions.ts` | Server Actions | `schedulePost`, `saveIdea` |
| `src/app/admin/social/page.tsx` | Server Component | Page shell + Buffer data fetch |
| `src/components/admin/SocialManager.tsx` | Client Component | Full 3-panel UI |

### Modified files

| File | Change |
|------|--------|
| `src/lib/audit.ts` | Add `social_post_scheduled` + `social_idea_saved` to `AuditEventType`; add `social` to `AuditTargetType` |
| `src/components/admin/AdminSidebar.tsx` | Add `Social` nav item with 📣 emoji under Platform section |
| `.env.example` | Add `BUFFER_API_KEY`, `BUFFER_ORG_ID`, `ANTHROPIC_API_KEY` |
| `.env.local` | Add `BUFFER_API_KEY` with real key (already provided), `BUFFER_ORG_ID` placeholder |

---

## Step 1 — Buffer API client (`src/lib/buffer.ts`)

GraphQL client wrapping `fetch` to `https://api.buffer.com/graphql` with `Authorization: Bearer ${BUFFER_API_KEY}` header.

**Guard:** If `BUFFER_API_KEY` is not set, every exported function throws:
```
new Error('BUFFER_API_KEY not configured. Add it to your environment variables.')
```

### Types

```ts
type BufferChannel = {
  id: string
  name: string
  service: 'instagram' | 'facebook' | 'linkedin' | 'twitter'
  avatar: string
}

type BufferPost = {
  id: string
  text: string
  channelId: string
  dueAt: string
  status: 'scheduled' | 'sent' | 'error'
  assets: { url: string }[]
}

type CreatePostInput = {
  text: string
  channelIds: string[]
  dueAt?: string
  mode: 'addToQueue' | 'customScheduled'
  mediaUrls?: string[]
}
```

### Exported functions

**`getChannels(orgId)`**
```graphql
query { channels(organizationId: $orgId) { id name service avatar } }
```

**`getScheduledPosts(orgId)`**
```graphql
query {
  posts(first: 50, input: { organizationId: $orgId, filter: { status: [scheduled] } }) {
    id text channelId dueAt status assets { url }
  }
}
```

**`getSentPosts(orgId, limit = 10)`** — same shape, `status: [sent]`

**`createPost(input)`** — fires one mutation per `channelId` (Buffer is per-channel). Returns `{ id, dueAt }[]` collected across all mutations. Handles `PostActionSuccess | MutationError` union — extracts error message from `MutationError` and throws.

**`createIdea(orgId, title, text)`**
```graphql
mutation { createIdea(organizationId: $orgId, title: $title, text: $text) { id } }
```

---

## Step 2 — Image upload route (`src/app/api/social/upload-image/route.ts`)

`POST` — accepts `multipart/form-data`, field: `image`

Validation:
- MIME type must be `image/jpeg`, `image/png`, or `image/webp` → 400 if invalid
- Max 5MB → 400 if exceeded

Success response: `{ dataUrl: string, filename: string, mimeType: string }`

The `dataUrl` is held in React state and shown as an image thumbnail in the composer. **No image is sent to Buffer** — text-only posts are scheduled. A `// TODO:` comment marks where Supabase Storage or Cloudflare Images upload would go to produce a public URL for Buffer's `mediaUrls` input. UI shows: "📌 Image preview only — image hosting required to attach images to Buffer posts. Coming in a future update."

---

## Step 3 — Caption generator route (`src/app/api/social/generate-caption/route.ts`)

`POST` — accepts `{ topic, pillar, platforms, audience }`

**One Anthropic call** (model `claude-sonnet-4-20250514`, max_tokens 1000) with the full TeeAhead brand voice system prompt (as specified). User message:

```
Write captions for: {platforms.join(', ')}.
Pillar: {pillar}. Topic: {topic}. Audience: {audience}.
```

Response: `Record<string, { caption, bestTime, growthNote }>` — only keys for requested platforms.

Error handling:
- JSON parse failure → `{ error: 'Parse failed' }` with 500
- Non-200 from Anthropic → `{ error: string }` with 500

**Key brand rules enforced in system prompt:**
- "Zero booking fees" only applies to Eagle and Ace members — never blanket
- Never use "The Turn" or "MulliganLinks"
- Never the unsupported GolfNow exodus stat
- Only Windsor Parke, Missouri Bluffs, Brown Golf as verified case studies
- LinkedIn never recommended on weekends
- Instagram captions always include `#TeeAhead #MetroDetroitGolf #GolfMichigan`

---

## Step 4 — Server Actions (`src/app/admin/social/actions.ts`)

Follows exact pattern from `communications/actions.ts`:
- `'use server'` directive
- Copies `assertAdmin()` function (ADMIN_EMAILS + profiles.is_admin check)

**`schedulePost(formData)`**
- Parses: `text`, `channelIds` (JSON string → string[]), `dueAt` (optional ISO), `mode`
- Calls `buffer.createPost()`
- Writes audit log: `event_type = 'social_post_scheduled'`, `target_type = 'social'`, `details = { channelCount, dueAt, textPreview: text.slice(0,60) }`
- Returns `{ success: boolean; error?: string }` — catches errors, returns them as `{ success: false, error }`

**`saveIdea(formData)`**
- Parses: `title`, `text`
- Calls `buffer.createIdea(orgId, title, text)`
- Writes audit log: `event_type = 'social_idea_saved'`, `target_type = 'social'`, `details = { title }`
- Returns `{ success: boolean; error?: string }`

Both actions use `BUFFER_ORG_ID` from `process.env`. If missing, returns `{ success: false, error: 'Buffer not configured' }`.

---

## Step 5 — Page (`src/app/admin/social/page.tsx`)

Server component. Auth identical to `layout.tsx` — `createClient()` + `createAdminClient()`. Redirects to `/admin` if not super-admin.

On load:
1. Auth check → redirect to `/admin` if unauthorized
2. Check `process.env.BUFFER_API_KEY` — if missing, render setup banner only (no Buffer calls)
3. If configured: parallel `Promise.all([getChannels(), getScheduledPosts(), getSentPosts()])` — catch errors and pass empty arrays with a `bufferError` flag
4. Pass `channels`, `scheduledPosts`, `sentPosts`, `bufferError?` to `<SocialManager />` client component

**Setup banner** (when `BUFFER_API_KEY` missing):
- Styled: `bg-amber-50 border border-amber-200 rounded-xl p-6`
- Title: "Buffer not connected"
- Body: "Add `BUFFER_API_KEY` and `BUFFER_ORG_ID` to your environment variables to enable social scheduling. Get your key at publish.buffer.com/settings/api"

---

## Step 6 — SocialManager client component (`src/components/admin/SocialManager.tsx`)

`'use client'`

Props: `{ channels: BufferChannel[], scheduledPosts: BufferPost[], sentPosts: BufferPost[] }`

### Layout

3-column on desktop (`grid-cols-[30%_40%_30%]`), stacked on mobile. All columns wrapped in `bg-white rounded-xl ring-1 ring-black/5 p-5` cards. Matches admin visual style (`#1B4332` primary, `#6B7770` muted, `#1A1A1A` headings).

---

### LEFT: Composer

**Field 1 — Topic**
- Label: "What's this post about?"
- Full-width text input, required, controlled

**Field 2 — Audience**
- Segmented radio: "Course Operators" | "Golfers"
- Tailwind toggle-button style

**Field 3 — Content Pillar**
- Radio group, 4 options with percentage hints in muted text:
  - Education/Outrage (35%)
  - Detroit Pride (25%)
  - FOMO/Social Proof (25%)
  - Direct Conversion (15%)

**Field 4 — Platforms**
- 4 checkboxes with platform color badges
- Default: Instagram + Facebook checked
- Platform badge colors:
  - Instagram: `bg-gradient-to-r from-pink-500 to-orange-400` text-white
  - Facebook: `bg-blue-600` text-white
  - LinkedIn: `bg-blue-700` text-white
  - Twitter/X: `bg-black` text-white

**Field 5 — Caption Tabs**
- One tab per checked platform
- Each tab: editable `<textarea>` (controlled), pre-populated by AI
- Below textarea: `bestTime` (muted) + `growthNote` (italic muted)

**Generate Captions button**
- Full-width primary: "✨ Generate Captions"
- Disabled when `topic` is empty
- `onClick`: POST `/api/social/generate-caption`
- Loading: spinner + "Generating..."
- Error: inline below button, non-blocking

**Field 6 — Image Attachment**
- Drag-and-drop zone + "Browse" button (`<input type="file" accept="image/jpeg,image/png,image/webp">`)
- On select: POST `/api/social/upload-image`, show thumbnail on success
- Remove (×) button on thumbnail
- Canva links below zone (new tab):
  - "Open Canva →" → `https://canva.com/create/social-media`
  - "Browse your Canva designs →" → `https://www.canva.com`
- Note: "📌 Image preview only — image hosting required..."

**Field 7 — Schedule Controls**
- Toggle: "Add to queue" (default) | "Schedule for specific time"
- Custom time: date picker + 12hr time picker, default next Saturday 8:00 AM local
- Helper: "💡 Saturday 8am is your highest-value Instagram slot"
- Multi-select channel dropdown, grouped by platform, default: channels matching checked platforms

**Buttons**
- Primary: "Schedule Post" → calls `schedulePost` server action
  - Success toast: "Scheduled for {date}" or "Added to queue ✓"
  - Error toast: Buffer error message
- Secondary text link: "Save as Idea instead →" → calls `saveIdea` server action
  - Success toast: "Idea saved to Buffer backlog ✓"

---

### CENTER: Queue

**Header:** "Scheduled ({count})"

**Saturday Warning Banner** (conditional):
- Logic: check if any `scheduledPost.dueAt` falls on the coming Saturday between 07:00–09:00 AM EST
- If none: amber banner "⚠️ No post scheduled for Saturday 8am — your highest-value slot is empty."
- "Fill this slot →" button: sets schedule toggle to "Schedule for specific time", pre-fills next Saturday 8:00 AM, smooth-scrolls to composer on mobile

**Post Cards:**
- Platform badge (colored pill)
- Text: 2 lines truncated, expandable
- Scheduled time: "Sat May 10 · 8:00 AM EST"
- Status badge: `bg-emerald-100 text-emerald-800` Scheduled | `bg-red-100 text-red-700` Error
- Image thumbnail if assets present (48px, rounded)
- Sorted ascending by `dueAt`, grouped by date dividers if >5 posts

**Empty state:** "No posts scheduled. Use the composer to add to your queue."

---

### RIGHT: Ideas + Recent

**Top half — Ideas Bank**
- Header: "Content Ideas"
- Muted description
- Text input + "Save Idea" button (secondary)
- Clears on success, toast: "Idea saved ✓"

**Bottom half — Recently Sent**
- Header: "Recently Sent"
- Last 5 sent posts, muted card style (lower opacity)
- Platform badge + truncated text + "Sent {relative time}"
- Empty state: "No recent posts yet."

---

## Step 7 — Admin Nav

Add to `AdminSidebar.tsx` under Platform section:
```tsx
<SidebarItem href="/admin/social" icon="📣" label="Social" active={pathname === '/admin/social'} />
```
Position: between "Content" and "Courses".

---

## Step 8 — Env vars

`.env.example` additions:
```bash
# Anthropic
ANTHROPIC_API_KEY=      # Already used in other routes

# Buffer
BUFFER_API_KEY=         # publish.buffer.com/settings/api
BUFFER_ORG_ID=          # Buffer organization ID — fetch once with getOrganizations query
```

`.env.local` additions:
```
BUFFER_API_KEY=_MYk-_yqq-lRkrm3g0gOff3Q5uKBoE3E1liqFhU_ou2
BUFFER_ORG_ID=          # to be filled in
```

**Deployment note:** Both `BUFFER_API_KEY` and `BUFFER_ORG_ID` must be added to Vercel dashboard environment variables (Production + Preview) before this feature goes live.

---

## Error handling matrix

| Scenario | Behavior |
|----------|----------|
| `BUFFER_API_KEY` missing | Setup banner, no crash, all Buffer calls short-circuit |
| Buffer `MutationError` | Extract message, surface in toast |
| Caption generation failure | Inline non-blocking message below button |
| Image upload >5MB or wrong type | Inline validation error below upload zone |
| Buffer API network timeout | Toast: "Buffer API unavailable — try again" |
| Caption JSON parse error | `{ error: 'Parse failed' }`, show inline |

---

## Audit log additions

Two new values in `src/lib/audit.ts`:

```ts
// AuditEventType additions:
| 'social_post_scheduled'
| 'social_idea_saved'

// AuditTargetType addition:
| 'social'
```

---

## Acceptance criteria

1. `/admin/social` loads and shows live scheduled posts and channels from Buffer
2. "Generate Captions" populates all selected platform tabs with brand-voice copy, best times, and growth notes
3. Instagram captions always include `#TeeAhead #MetroDetroitGolf #GolfMichigan`
4. LinkedIn captions never recommend weekend posting times
5. "Schedule Post" creates a post in Buffer — verifiable in Buffer dashboard
6. Saturday 8am warning banner appears when that slot is empty
7. "Fill this slot →" pre-fills composer to next Saturday 8:00 AM
8. "Save as Idea" pushes to Buffer Ideas (visible in Buffer app)
9. "Open Canva →" and "Browse your Canva designs →" open correct URLs in new tabs
10. Image upload shows preview thumbnail with honest "preview only" note
11. Super-admin auth gate enforced — non-admins redirected to `/admin`
12. `BUFFER_API_KEY` missing → setup banner, no error crash
13. Brand voice rules enforced: no blanket "zero booking fees", no dead names, no fabricated stats, only verified case studies
