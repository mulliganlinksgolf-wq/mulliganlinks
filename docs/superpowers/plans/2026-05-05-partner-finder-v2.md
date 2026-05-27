# Partner Finder v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add play style, gender/safety filtering, profile photos, and post-round ratings to the partner finder so it's safe and complete enough to ship.

**Architecture:** Four self-contained additions on top of the existing partner finder (branch `feature/partner-finder`): (1) a DB migration adds three columns to `partner_preferences`, `avatar_url` to `profiles`, a new `partner_ratings` table, and a Supabase Storage bucket; (2) the preferences form gets new fields and a photo uploader; (3) the browse feed applies server-side mutual gender filtering and shows photos/ratings on cards; (4) the requests page gains a rate-your-partner flow after rounds complete.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (PostgreSQL + Storage), Tailwind CSS, Vitest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/054_partner_finder_v2.sql` | Create | DB schema additions + RLS |
| `src/types/partners.ts` | Modify | New types: PlayStyle, Gender, OpenTo, PartnerRating |
| `src/app/app/partners/actions.ts` | Modify | Add `uploadAvatar`, `submitRating` actions; update `upsertPartnerPreferences` |
| `src/app/app/partners/preferences/PreferencesForm.tsx` | Modify | Add play_style, gender, open_to fields + photo upload UI |
| `src/app/app/partners/page.tsx` | Modify | Fetch viewer prefs; apply mutual gender filter; pass avg_rating to feed |
| `src/components/PartnerCard.tsx` | Modify | Show avatar, play_style chip, star rating |
| `src/components/RatingModal.tsx` | Create | 1–5 star rating modal with optional comment |
| `src/app/app/partners/requests/page.tsx` | Modify | Add "Rate" button for completed rounds; fix `avatar_url` select |

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/054_partner_finder_v2.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/054_partner_finder_v2.sql

-- 1. New columns on partner_preferences
ALTER TABLE partner_preferences
  ADD COLUMN IF NOT EXISTS play_style text
    CHECK (play_style IN ('casual', 'moderate', 'competitive')) DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS gender text
    CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')) DEFAULT 'prefer_not_to_say',
  ADD COLUMN IF NOT EXISTS open_to text
    CHECK (open_to IN ('anyone', 'same_gender_only', 'men_only', 'women_only')) DEFAULT 'anyone';

-- 2. Avatar on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Ratings table
CREATE TABLE IF NOT EXISTS partner_ratings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ratee_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_request_id uuid NOT NULL REFERENCES partner_connection_requests(id) ON DELETE CASCADE,
  stars                 integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment               text CHECK (char_length(comment) <= 280),
  created_at            timestamptz DEFAULT now(),
  UNIQUE (rater_id, connection_request_id)
);

ALTER TABLE partner_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read ratings
CREATE POLICY "pr_select" ON partner_ratings
  FOR SELECT TO authenticated USING (true);

-- Can only rate once per connection, only if you were part of it,
-- only after the round date has passed
CREATE POLICY "pr_insert" ON partner_ratings
  FOR INSERT WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM partner_connection_requests pcr
      JOIN partner_availability pa ON pa.id = pcr.availability_id
      WHERE pcr.id = connection_request_id
        AND pcr.status = 'accepted'
        AND pa.available_date < CURRENT_DATE
        AND (pcr.requester_id = auth.uid() OR pcr.recipient_id = auth.uid())
    )
  );

-- 4. Supabase Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage: anyone can read; owners can upload/delete their own files
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

- [ ] **Step 2: Apply migration to linked project**

```bash
npx supabase db query --linked "$(cat supabase/migrations/054_partner_finder_v2.sql)"
```

Expected: no errors, `{}` rows returned.

- [ ] **Step 3: Verify columns exist**

```bash
node -e "
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
admin.from('partner_preferences').select('play_style, gender, open_to').limit(1).then(r => console.log('prefs cols:', r.error ?? 'OK'))
admin.from('profiles').select('avatar_url').limit(1).then(r => console.log('profiles col:', r.error ?? 'OK'))
admin.from('partner_ratings').select('id').limit(1).then(r => console.log('ratings table:', r.error ?? 'OK'))
admin.storage.getBucket('avatars').then(r => console.log('bucket:', r.error ?? 'OK'))
"
```

Expected: all four lines print `OK`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/054_partner_finder_v2.sql
git commit -m "feat(db): add play_style/gender/open_to, avatar_url, partner_ratings, avatars bucket"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/partners.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/test/partner-types.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type { PartnerPreferences, PartnerRating, PlayStyle, Gender, OpenTo } from '@/types/partners'

describe('partner types', () => {
  it('PartnerPreferences includes v2 fields', () => {
    expectTypeOf<PartnerPreferences>().toHaveProperty('play_style')
    expectTypeOf<PartnerPreferences>().toHaveProperty('gender')
    expectTypeOf<PartnerPreferences>().toHaveProperty('open_to')
  })

  it('PlayStyle values are correct', () => {
    const valid: PlayStyle[] = ['casual', 'moderate', 'competitive']
    expectTypeOf(valid[0]).toEqualTypeOf<PlayStyle>()
  })

  it('PartnerRating has required fields', () => {
    expectTypeOf<PartnerRating>().toHaveProperty('stars')
    expectTypeOf<PartnerRating>().toHaveProperty('connection_request_id')
    expectTypeOf<PartnerRating>().toHaveProperty('rater_id')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/partner-types.test.ts
```

Expected: FAIL — `PlayStyle`, `Gender`, `OpenTo`, `PartnerRating` not exported.

- [ ] **Step 3: Update `src/types/partners.ts`**

Replace the entire file with:

```typescript
export type PacePreference = 'relaxed' | 'moderate' | 'fast'
export type TimePreference = 'morning' | 'afternoon' | 'evening' | 'flexible'
export type HolePreference = '9' | '18' | 'either'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'any'
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'
export type PlayStyle = 'casual' | 'moderate' | 'competitive'
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
export type OpenTo = 'anyone' | 'same_gender_only' | 'men_only' | 'women_only'

export interface PartnerPreferences {
  id: string
  profile_id: string
  handicap_index: number | null
  pace_preference: PacePreference | null
  prefers_walking: boolean
  drinks_ok: boolean
  smoking_ok: boolean
  preferred_holes: HolePreference
  skill_level: SkillLevel
  bio: string | null
  is_visible: boolean
  updated_at: string
  // v2
  play_style: PlayStyle
  gender: Gender
  open_to: OpenTo
}

export interface PartnerRating {
  id: string
  rater_id: string
  ratee_id: string
  connection_request_id: string
  stars: number
  comment: string | null
  created_at: string
}

export interface PartnerAvailability {
  id: string
  profile_id: string
  available_date: string
  time_preference: TimePreference
  course_id: string | null
  holes: HolePreference
  notes: string | null
  is_active: boolean
  expires_at: string
  created_at: string
  // joined
  profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  preferences?: PartnerPreferences
  course?: {
    id: string
    name: string
    slug: string
  }
  avg_rating?: number | null
  rating_count?: number
}

export interface ConnectionRequest {
  id: string
  requester_id: string
  recipient_id: string
  availability_id: string | null
  message: string | null
  status: RequestStatus
  created_at: string
  updated_at: string
  requester?: { full_name: string | null; avatar_url: string | null }
  recipient?: { full_name: string | null; avatar_url: string | null }
  availability?: { available_date: string } | null
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/partner-types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Verify no TS errors in source files**

```bash
npx tsc --noEmit 2>&1 | grep -v "src/test/"
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/types/partners.ts src/test/partner-types.test.ts
git commit -m "feat(types): add PlayStyle, Gender, OpenTo, PartnerRating to partner types"
```

---

### Task 3: Avatar Photo Upload

**Files:**
- Modify: `src/app/app/partners/actions.ts` — add `uploadAvatar`
- Modify: `src/app/app/partners/preferences/PreferencesForm.tsx` — add photo upload UI

**Context:** Supabase Storage is used. The file is uploaded from a server action that receives a `FormData`. Files are stored at `{userId}/avatar` in the `avatars` bucket (public). The public URL is then saved to `profiles.avatar_url`.

- [ ] **Step 1: Add `uploadAvatar` to `src/app/app/partners/actions.ts`**

Add this function at the end of the file (keep all existing functions intact):

```typescript
export async function uploadAvatar(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No file provided.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Photo must be under 5 MB.' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Only JPEG, PNG, or WebP photos are supported.' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/app/partners/preferences')
  revalidatePath('/app/partners')
  return { url: publicUrl }
}
```

- [ ] **Step 2: Add photo upload UI to `PreferencesForm.tsx`**

Add an import for `uploadAvatar` and a new `AvatarSection` component at the top of the file, then add it inside the `<form>` as the first field. The complete updated file:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { upsertPartnerPreferences, uploadAvatar } from '../actions'
import type {
  PartnerPreferences, PacePreference, HolePreference, SkillLevel,
  PlayStyle, Gender, OpenTo,
} from '@/types/partners'

function AvatarSection({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, startUpload] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    const fd = new FormData()
    fd.append('avatar', file)
    startUpload(async () => {
      const result = await uploadAvatar(fd)
      if (result.error) { setErr(result.error); setPreview(currentUrl) }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[#8FA889] text-2xl">
            👤
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs">…</span>
          </div>
        )}
      </div>
      <div>
        <label
          htmlFor="avatar-upload"
          className="cursor-pointer text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
        >
          {preview ? 'Change photo' : 'Upload photo'}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFile}
        />
        <p className="text-xs text-[#8FA889] mt-1">JPEG, PNG or WebP · max 5 MB</p>
        {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
      </div>
    </div>
  )
}

export function PreferencesForm({
  existing,
  avatarUrl,
}: {
  existing: PartnerPreferences | null
  avatarUrl: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [handicap, setHandicap] = useState(existing?.handicap_index?.toString() ?? '')
  const [pace, setPace] = useState<PacePreference | ''>(existing?.pace_preference ?? '')
  const [walking, setWalking] = useState(existing?.prefers_walking ?? false)
  const [drinksOk, setDrinksOk] = useState(existing?.drinks_ok ?? true)
  const [smokingOk, setSmokingOk] = useState(existing?.smoking_ok ?? false)
  const [holes, setHoles] = useState<HolePreference>(existing?.preferred_holes ?? 'either')
  const [skill, setSkill] = useState<SkillLevel>(existing?.skill_level ?? 'any')
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [visible, setVisible] = useState(existing?.is_visible ?? true)
  const [playStyle, setPlayStyle] = useState<PlayStyle>(existing?.play_style ?? 'casual')
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'prefer_not_to_say')
  const [openTo, setOpenTo] = useState<OpenTo>(existing?.open_to ?? 'anyone')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await upsertPartnerPreferences({
        handicap_index: handicap ? parseFloat(handicap) : null,
        pace_preference: pace || null,
        prefers_walking: walking,
        drinks_ok: drinksOk,
        smoking_ok: smokingOk,
        preferred_holes: holes,
        skill_level: skill,
        bio: bio || null,
        is_visible: visible,
        play_style: playStyle,
        gender,
        open_to: openTo,
      })
      if (result.error) { setError(result.error) } else { setSaved(true) }
    })
  }

  const paceOptions: PacePreference[] = ['relaxed', 'moderate', 'fast']
  const holeOptions: HolePreference[] = ['9', '18', 'either']
  const skillOptions: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'any']
  const playStyleOptions: { value: PlayStyle; label: string }[] = [
    { value: 'casual', label: 'Casual' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'competitive', label: 'Competitive' },
  ]
  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]
  const openToOptions: { value: OpenTo; label: string; desc: string }[] = [
    { value: 'anyone', label: 'Anyone', desc: 'Open to playing with anyone' },
    { value: 'same_gender_only', label: 'Same gender only', desc: 'Only show me to members with my gender' },
    { value: 'men_only', label: 'Men only', desc: 'Only show me men\'s availability' },
    { value: 'women_only', label: 'Women only', desc: 'Only show me women\'s availability' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">

      {/* Photo */}
      <AvatarSection currentUrl={avatarUrl} />

      {/* Play style */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Play Style</span>
        <div className="flex gap-2 flex-wrap">
          {playStyleOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPlayStyle(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                playStyle === value ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8FA889] mt-1">
          {playStyle === 'casual' ? 'Here to have fun and enjoy the round.' : playStyle === 'moderate' ? 'Enjoy the game and play well.' : 'Focused on score and performance.'}
        </p>
      </div>

      {/* Gender */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">I identify as</span>
        <div className="flex flex-wrap gap-2">
          {genderOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGender(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                gender === value ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Open to */}
      <div>
        <span className="block text-sm font-medium text-white mb-1">I want to play with</span>
        <p className="text-xs text-[#8FA889] mb-2">Controls both who you see and who sees you.</p>
        <div className="space-y-2">
          {openToOptions.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOpenTo(value)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                openTo === value
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/10 text-[#8FA889] hover:bg-white/5'
              }`}
            >
              <span className="font-medium">{label}</span>
              <span className="block text-xs opacity-70 mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Handicap */}
      <div>
        <label htmlFor="handicap" className="block text-sm font-medium text-white mb-1">
          Handicap Index
        </label>
        <input
          id="handicap"
          type="number"
          min={0}
          max={54}
          step={0.1}
          value={handicap}
          onChange={e => setHandicap(e.target.value)}
          placeholder="e.g. 14.2"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889]"
        />
      </div>

      {/* Pace */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Pace</span>
        <div className="flex gap-2">
          {paceOptions.map(p => (
            <button key={p} type="button" onClick={() => setPace(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${pace === p ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      {[
        { label: 'Prefer to walk', value: walking, set: setWalking },
        { label: 'Drinks OK', value: drinksOk, set: setDrinksOk },
        { label: 'Smoking OK', value: smokingOk, set: setSmokingOk },
      ].map(({ label, value, set }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{label}</span>
          <button type="button" role="switch" aria-checked={value} onClick={() => set(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#52B788]' : 'bg-white/20'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      ))}

      {/* Holes */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Holes</span>
        <div className="flex gap-2">
          {holeOptions.map(h => (
            <button key={h} type="button" onClick={() => setHoles(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${holes === h ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'}`}>
              {h === 'either' ? 'Either' : `${h} holes`}
            </button>
          ))}
        </div>
      </div>

      {/* Skill */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Skill Level</span>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map(s => (
            <button key={s} type="button" onClick={() => setSkill(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${skill === s ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white mb-1">Bio</label>
        <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={280} rows={3}
          placeholder="Tell other golfers a bit about your game..."
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none" />
        <p className="text-xs text-[#8FA889] mt-1 text-right">{bio.length} / 280</p>
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white">Visible in Partner Finder</span>
          <p className="text-xs text-[#8FA889]">Turn off to hide from other members</p>
        </div>
        <input id="visible-toggle" type="checkbox" aria-label="Visible in Partner Finder"
          checked={visible} onChange={e => setVisible(e.target.checked)}
          className="w-5 h-5 rounded accent-[#52B788]" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-[#52B788] text-sm">Preferences saved!</p>}

      <button type="submit" disabled={isPending}
        className="w-full bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2] disabled:opacity-50">
        {isPending ? 'Saving…' : 'Save Preferences'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Update `preferences/page.tsx` to pass `avatarUrl` prop**

In `src/app/app/partners/preferences/page.tsx`, add a profile fetch and pass `avatarUrl`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerPreferences } from '@/types/partners'
import { PreferencesForm } from './PreferencesForm'

export const metadata: Metadata = { title: 'Partner Profile — TeeAhead' }

export default async function PreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'

  const [{ data: existing }, { data: profile }] = await Promise.all([
    supabase.from('partner_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Partner Profile</h1>
        <p className="text-[#8FA889] mt-1">
          Control how you appear to other members in Find a Partner.
        </p>
      </div>

      {tier === 'fairway' ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-white font-medium mb-2">Eagle or Ace membership required</p>
          <p className="text-[#8FA889] text-sm mb-4">
            Upgrade to Eagle to set your partner profile and appear in the feed.
          </p>
          <a href="/app/membership"
            className="inline-block bg-white text-[#1B4332] font-semibold px-6 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]">
            Upgrade to Eagle →
          </a>
        </div>
      ) : (
        <PreferencesForm
          existing={existing as PartnerPreferences | null}
          avatarUrl={(profile as any)?.avatar_url ?? null}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit 2>&1 | grep -v "src/test/"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/partners/actions.ts src/app/app/partners/preferences/PreferencesForm.tsx src/app/app/partners/preferences/page.tsx
git commit -m "feat(partners): add avatar photo upload to partner profile"
```

---

### Task 4: Preferences Form — Play Style, Gender, Open To Fields

This task is already complete as part of Task 3 — the `PreferencesForm.tsx` in Task 3 includes all three new fields. The only remaining step is updating `actions.ts` to accept the new fields.

**Files:**
- Modify: `src/app/app/partners/actions.ts`

- [ ] **Step 1: The `upsertPartnerPreferences` function already accepts `Partial<Omit<PartnerPreferences, 'id' | 'profile_id' | 'updated_at'>>`. Since `PartnerPreferences` now includes `play_style`, `gender`, `open_to`, the action automatically accepts them. Verify:**

```bash
node -e "
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
admin.from('partner_preferences').upsert({
  profile_id: '2c4dfd98-04da-4f24-b724-a61e402747f3',
  play_style: 'competitive',
  gender: 'male',
  open_to: 'anyone',
  updated_at: new Date().toISOString(),
}, { onConflict: 'profile_id' }).then(r => console.log(r.error ?? 'OK'))
"
```

Expected: `OK`

- [ ] **Step 2: Commit (if no code change needed, this step is a no-op — move on)**

```bash
git add src/app/app/partners/actions.ts
git commit -m "chore: confirm upsertPartnerPreferences accepts v2 fields" --allow-empty
```

---

### Task 5: Browse Feed — Mutual Gender Filtering, Avatar, Play Style, Ratings

**Files:**
- Modify: `src/app/app/partners/page.tsx`
- Modify: `src/components/PartnerCard.tsx`

**Context:** The browse feed already fetches `partner_preferences` nested in the profile join. We add: (1) a parallel fetch of the viewer's own preferences to know their gender/open_to; (2) server-side mutual gender filtering; (3) a ratings subquery for each availability's profile; (4) updated `PartnerCard` to show avatar, play_style, and star rating.

- [ ] **Step 1: Update `src/app/app/partners/page.tsx`**

Replace the full file with:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerAvailability, Gender, OpenTo } from '@/types/partners'
import { BrowseFeed } from './BrowseFeed'

export const metadata: Metadata = { title: 'Find a Partner — TeeAhead' }

function buildDateLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  const formatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  if (diff === 0) return `Today — ${formatted}`
  if (diff === 1) return `Tomorrow — ${formatted}`
  return formatted
}

function isGenderCompatible(
  viewerGender: Gender,
  viewerOpenTo: OpenTo,
  posterGender: Gender,
  posterOpenTo: OpenTo,
): boolean {
  // Check poster's preference: are they open to the viewer?
  if (posterOpenTo !== 'anyone') {
    if (posterOpenTo === 'same_gender_only' && posterGender !== viewerGender) return false
    if (posterOpenTo === 'men_only' && viewerGender !== 'male') return false
    if (posterOpenTo === 'women_only' && viewerGender !== 'female') return false
  }
  // Check viewer's preference: are they open to the poster?
  if (viewerOpenTo !== 'anyone') {
    if (viewerOpenTo === 'same_gender_only' && viewerGender !== posterGender) return false
    if (viewerOpenTo === 'men_only' && posterGender !== 'male') return false
    if (viewerOpenTo === 'women_only' && posterGender !== 'female') return false
  }
  return true
}

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'
  const canRequest = tier !== 'fairway'

  const today = new Date().toISOString().slice(0, 10)
  const fourteenDays = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)

  const [{ data: rows }, { data: sentRequests }, { data: viewerPrefs }, { data: viewerProfile }] = await Promise.all([
    supabase
      .from('partner_availability')
      .select(`
        id, profile_id, available_date, time_preference, holes, notes, course_id, expires_at, is_active, created_at,
        profile:profiles!profile_id(
          id, full_name, avatar_url,
          partner_preferences(
            id, profile_id, handicap_index, pace_preference, prefers_walking,
            drinks_ok, smoking_ok, preferred_holes, skill_level, bio, is_visible, updated_at,
            play_style, gender, open_to
          )
        ),
        course:courses(id, name, slug)
      `)
      .neq('profile_id', user.id)
      .eq('is_active', true)
      .gte('available_date', today)
      .lte('available_date', fourteenDays)
      .order('available_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('partner_connection_requests')
      .select('availability_id')
      .eq('requester_id', user.id)
      .in('status', ['pending', 'accepted']),
    supabase
      .from('partner_preferences')
      .select('gender, open_to')
      .eq('profile_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const viewerGender = (viewerPrefs?.gender ?? 'prefer_not_to_say') as Gender
  const viewerOpenTo = (viewerPrefs?.open_to ?? 'anyone') as OpenTo

  // Hoist preferences out of nested profile join; apply mutual gender filter
  const availabilities = (rows ?? [])
    .map((row: any) => ({
      ...row,
      profile: {
        id: row.profile?.id,
        full_name: row.profile?.full_name,
        avatar_url: row.profile?.avatar_url ?? null,
      },
      preferences: Array.isArray(row.profile?.partner_preferences)
        ? row.profile.partner_preferences[0] ?? undefined
        : row.profile?.partner_preferences ?? undefined,
    }))
    .filter((av: any) => {
      const prefs = av.preferences
      if (!prefs) return true // no prefs set — show them
      const posterGender = (prefs.gender ?? 'prefer_not_to_say') as Gender
      const posterOpenTo = (prefs.open_to ?? 'anyone') as OpenTo
      return isGenderCompatible(viewerGender, viewerOpenTo, posterGender, posterOpenTo)
    }) as unknown as PartnerAvailability[]

  const sentToAvailabilityIds = (sentRequests ?? [])
    .map((r: { availability_id: string | null }) => r.availability_id)
    .filter((id): id is string => id !== null)

  // Fetch avg ratings for all poster profile_ids
  const profileIds = [...new Set(availabilities.map(av => av.profile_id))]
  const ratingsMap: Record<string, { avg: number; count: number }> = {}
  if (profileIds.length > 0) {
    const { data: ratings } = await supabase
      .from('partner_ratings')
      .select('ratee_id, stars')
      .in('ratee_id', profileIds)
    for (const r of (ratings ?? [])) {
      const entry = ratingsMap[r.ratee_id] ?? { avg: 0, count: 0 }
      entry.count += 1
      entry.avg = (entry.avg * (entry.count - 1) + r.stars) / entry.count
      ratingsMap[r.ratee_id] = entry
    }
  }

  const availabilitiesWithRatings = availabilities.map(av => ({
    ...av,
    avg_rating: ratingsMap[av.profile_id]?.count >= 3 ? ratingsMap[av.profile_id].avg : null,
    rating_count: ratingsMap[av.profile_id]?.count ?? 0,
  }))

  // Group by date
  const groupMap = new Map<string, PartnerAvailability[]>()
  for (const av of availabilitiesWithRatings) {
    const existing = groupMap.get(av.available_date) ?? []
    existing.push(av)
    groupMap.set(av.available_date, existing)
  }
  const grouped = Array.from(groupMap.entries()).map(([date, items]) => ({
    date,
    dateLabel: buildDateLabel(date),
    items,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Find a Playing Partner</h1>
          <p className="text-[#8FA889] mt-1">Members available to play in the next 14 days.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/app/partners/preferences"
            className="bg-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/20"
          >
            My Profile
          </a>
          <a
            href="/app/partners/my-availability"
            className="bg-white text-[#1B4332] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]"
          >
            + My Availability
          </a>
        </div>
      </div>

      <BrowseFeed
        grouped={grouped}
        canRequest={canRequest}
        sentToAvailabilityIds={sentToAvailabilityIds}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update `src/components/PartnerCard.tsx`**

Replace the full file with:

```typescript
import type { PartnerAvailability } from '@/types/partners'

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible',
}

const PLAY_STYLE_LABELS: Record<string, string> = {
  casual: '🎉 Casual', moderate: '⛳ Moderate', competitive: '🏆 Competitive',
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  const full = Math.round(avg)
  return (
    <span className="flex items-center gap-1 text-xs text-[#8FA889]">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= full ? 'text-[#E0A800]' : 'opacity-30'}>★</span>
      ))}
      <span className="ml-0.5">{avg.toFixed(1)} ({count})</span>
    </span>
  )
}

interface PartnerCardProps {
  availability: PartnerAvailability
  canRequest: boolean
  alreadyRequested: boolean
  onRequestClick: (availability: PartnerAvailability) => void
}

export function PartnerCard({ availability, canRequest, alreadyRequested, onRequestClick }: PartnerCardProps) {
  const { profile, preferences, course } = availability
  const name = displayName(profile?.full_name ?? null)
  const initials = getInitials(profile?.full_name ?? null)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-[#8FA889] text-xs">HCP: {preferences?.handicap_index ?? 'Not listed'}</p>
          {availability.avg_rating != null && availability.rating_count != null && (
            <StarRating avg={availability.avg_rating} count={availability.rating_count} />
          )}
        </div>
        <span className="ml-auto text-xs font-medium bg-white/10 text-white px-2.5 py-1 rounded-full capitalize flex-shrink-0">
          {TIME_LABELS[availability.time_preference] ?? availability.time_preference}
        </span>
      </div>

      {/* Preference chips */}
      <div className="flex flex-wrap gap-1.5">
        {preferences?.play_style && preferences.play_style !== 'casual' && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            {PLAY_STYLE_LABELS[preferences.play_style] ?? preferences.play_style}
          </span>
        )}
        {preferences?.prefers_walking !== undefined && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            {preferences.prefers_walking ? '🚶 Walking' : '🚗 Riding'}
          </span>
        )}
        {preferences?.pace_preference && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full capitalize">
            {preferences.pace_preference} pace
          </span>
        )}
        <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
          {availability.holes === 'either' ? '9 or 18' : `${availability.holes} holes`}
        </span>
        {preferences?.drinks_ok === false && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">No drinks</span>
        )}
        {preferences?.smoking_ok === true && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">Smoking OK</span>
        )}
      </div>

      {course && <p className="text-xs text-[#8FA889]">📍 {course.name}</p>}
      {preferences?.bio && <p className="text-sm text-[#8FA889] line-clamp-2">{preferences.bio}</p>}
      {availability.notes && <p className="text-xs text-[#8FA889] italic">"{availability.notes}"</p>}

      {canRequest ? (
        alreadyRequested ? (
          <button disabled className="w-full text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] cursor-default">
            Request already sent
          </button>
        ) : (
          <button onClick={() => onRequestClick(availability)}
            className="w-full text-sm font-semibold py-2 rounded-lg bg-white text-[#1B4332] hover:bg-[#FAF7F2]">
            Request to Play
          </button>
        )
      ) : (
        <a href="/app/membership"
          className="block text-center text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] hover:bg-white/10">
          Eagle members can connect →
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit 2>&1 | grep -v "src/test/"
```

Expected: no output.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all passing (same count as before).

- [ ] **Step 5: Commit**

```bash
git add src/app/app/partners/page.tsx src/components/PartnerCard.tsx
git commit -m "feat(partners): mutual gender filtering, avatar display, play_style chip, star ratings on card"
```

---

### Task 6: Post-Round Ratings

**Files:**
- Create: `src/components/RatingModal.tsx`
- Modify: `src/app/app/partners/actions.ts` — add `submitRating`
- Modify: `src/app/app/partners/requests/page.tsx` — "Rate" button + fix `avatar_url` select

- [ ] **Step 1: Add `submitRating` to `src/app/app/partners/actions.ts`**

Append at the end of the file (keep all existing functions):

```typescript
export async function submitRating(
  connectionRequestId: string,
  rateeId: string,
  stars: number,
  comment?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (stars < 1 || stars > 5) return { error: 'Stars must be between 1 and 5.' }
  if (comment && comment.length > 280) return { error: 'Comment must be 280 characters or fewer.' }

  const { error } = await supabase.from('partner_ratings').insert({
    rater_id: user.id,
    ratee_id: rateeId,
    connection_request_id: connectionRequestId,
    stars,
    comment: comment ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already rated this round.' }
    return { error: error.message }
  }

  revalidatePath('/app/partners/requests')
  return {}
}
```

- [ ] **Step 2: Create `src/components/RatingModal.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { submitRating } from '@/app/app/partners/actions'

interface RatingModalProps {
  connectionRequestId: string
  rateeId: string
  rateeName: string
  onClose: () => void
  onSubmitted: () => void
}

export function RatingModal({ connectionRequestId, rateeId, rateeName, onClose, onSubmitted }: RatingModalProps) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (stars === 0) { setError('Please select a star rating.'); return }
    setError(null)
    startTransition(async () => {
      const result = await submitRating(connectionRequestId, rateeId, stars, comment || undefined)
      if (result.error) { setError(result.error) } else { onSubmitted() }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1B4332] rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div>
          <h2 className="text-white font-bold text-lg">Rate Your Round</h2>
          <p className="text-[#8FA889] text-sm mt-1">How was playing with <strong className="text-white">{rateeName}</strong>?</p>
        </div>

        {/* Stars */}
        <div className="flex gap-2 justify-center py-2">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(i)}
              className={`text-3xl transition-transform hover:scale-110 ${
                i <= (hovered || stars) ? 'text-[#E0A800]' : 'text-white/20'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="rating-comment" className="block text-sm font-medium text-white mb-1">
            Comment <span className="text-[#8FA889] font-normal">(optional)</span>
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Great round, very friendly pace…"
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
          />
          <p className="text-xs text-[#8FA889] text-right mt-1">{comment.length} / 280</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending || stars === 0}
            className="flex-1 py-2.5 rounded-lg bg-white text-[#1B4332] text-sm font-semibold hover:bg-[#FAF7F2] disabled:opacity-50">
            {isPending ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `src/app/app/partners/requests/page.tsx`**

Replace the full file with a version that: (a) fixes the `avatar_url` select now that the column exists, (b) fetches existing ratings by the current user, (c) shows a "Rate" button for accepted past rounds, (d) renders the `RatingModal`.

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ConnectionRequest } from '@/types/partners'
import { RespondButtons, WithdrawButton } from './RequestActions'
import { RequestsWithRating } from './RequestsWithRating'

export const metadata: Metadata = { title: 'Partner Requests — TeeAhead' }

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300',
  declined: 'bg-red-500/20 text-red-300',
  withdrawn: 'bg-white/10 text-[#8FA889]',
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'sent' ? 'sent' : 'received'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: received }, { data: sent }, { data: myRatings }] = await Promise.all([
    supabase
      .from('partner_connection_requests')
      .select(`
        id, requester_id, recipient_id, availability_id, message, status, created_at, updated_at,
        requester:profiles!requester_id(full_name, avatar_url),
        availability:partner_availability(available_date)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('partner_connection_requests')
      .select(`
        id, requester_id, recipient_id, availability_id, message, status, created_at, updated_at,
        recipient:profiles!recipient_id(full_name, avatar_url),
        availability:partner_availability(available_date)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('partner_ratings')
      .select('connection_request_id')
      .eq('rater_id', user.id),
  ])

  const ratedRequestIds = new Set((myRatings ?? []).map((r: any) => r.connection_request_id))

  const receivedRequests = (received ?? []) as unknown as (ConnectionRequest & {
    availability: { available_date: string } | null
  })[]
  const sentRequests = (sent ?? []) as unknown as (ConnectionRequest & {
    availability: { available_date: string } | null
  })[]

  const pendingReceived = receivedRequests.filter(r => r.status === 'pending')
  const historicReceived = receivedRequests.filter(r => r.status !== 'pending')

  // Accepted past rounds eligible for rating
  function isRateable(r: ConnectionRequest & { availability: { available_date: string } | null }) {
    return r.status === 'accepted'
      && r.availability?.available_date != null
      && r.availability.available_date < today
      && !ratedRequestIds.has(r.id)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Partner Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(['received', 'sent'] as const).map(t => (
          <a
            key={t}
            href={t === 'received' ? '/app/partners/requests' : '/app/partners/requests?tab=sent'}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === t ? 'bg-white text-[#1B4332]' : 'text-[#8FA889] hover:text-white'
            }`}
          >
            {t}
            {t === 'received' && pendingReceived.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingReceived.length}
              </span>
            )}
          </a>
        ))}
      </div>

      {activeTab === 'received' ? (
        <div className="space-y-6">
          {pendingReceived.length === 0 && historicReceived.length === 0 && (
            <p className="text-[#8FA889]">No requests yet.</p>
          )}
          {pendingReceived.length > 0 && (
            <div className="space-y-3">
              {pendingReceived.map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {displayName((r.requester as any)?.full_name ?? null)}
                      </p>
                      {r.availability?.available_date && (
                        <p className="text-[#8FA889] text-xs">
                          {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                            'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                          )}
                        </p>
                      )}
                    </div>
                    <RespondButtons requestId={r.id} />
                  </div>
                  {r.message && (
                    <p className="text-sm text-[#8FA889] italic border-l-2 border-white/10 pl-3">
                      "{r.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {historicReceived.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#8FA889] uppercase tracking-wider mb-3">History</h3>
              <RequestsWithRating
                requests={historicReceived}
                isRateable={isRateable}
                otherPartyKey="requester"
                statusBadge={STATUS_BADGE}
                displayName={displayName}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          {sentRequests.length === 0 && (
            <p className="text-[#8FA889]">You haven't sent any requests yet.</p>
          )}
          <RequestsWithRating
            requests={sentRequests}
            isRateable={isRateable}
            otherPartyKey="recipient"
            statusBadge={STATUS_BADGE}
            displayName={displayName}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/app/partners/requests/RequestsWithRating.tsx`** (client component for rating interactivity)

```typescript
'use client'

import { useState } from 'react'
import { RatingModal } from '@/components/RatingModal'
import type { ConnectionRequest } from '@/types/partners'

interface Props {
  requests: (ConnectionRequest & { availability: { available_date: string } | null })[]
  isRateable: (r: ConnectionRequest & { availability: { available_date: string } | null }) => boolean
  otherPartyKey: 'requester' | 'recipient'
  statusBadge: Record<string, string>
  displayName: (name: string | null) => string
}

export function RequestsWithRating({ requests, isRateable, otherPartyKey, statusBadge, displayName }: Props) {
  const [ratingTarget, setRatingTarget] = useState<{
    requestId: string
    rateeId: string
    rateeName: string
  } | null>(null)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())

  return (
    <>
      <div className="space-y-2">
        {requests.map(r => {
          const otherParty = (r as any)[otherPartyKey]
          const name = displayName(otherParty?.full_name ?? null)
          const rateable = isRateable(r) && !ratedIds.has(r.id)
          const otherPartyId = otherPartyKey === 'requester' ? r.requester_id : r.recipient_id

          return (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3"
            >
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">{name}</p>
                {r.availability?.available_date && (
                  <p className="text-[#8FA889] text-xs">
                    {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                      'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[r.status] ?? 'bg-white/10 text-[#8FA889]'}`}>
                  {r.status}
                </span>
                {r.status === 'pending' && 'WithdrawButton' in r && (
                  <span />
                )}
                {rateable && (
                  <button
                    onClick={() => setRatingTarget({ requestId: r.id, rateeId: otherPartyId, rateeName: name })}
                    className="text-xs font-medium text-[#E0A800] hover:text-white px-2 py-1 rounded border border-[#E0A800]/30 hover:border-white/30 transition-colors"
                  >
                    ★ Rate
                  </button>
                )}
                {ratedIds.has(r.id) && (
                  <span className="text-xs text-[#52B788]">Rated ✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {ratingTarget && (
        <RatingModal
          connectionRequestId={ratingTarget.requestId}
          rateeId={ratingTarget.rateeId}
          rateeName={ratingTarget.rateeName}
          onClose={() => setRatingTarget(null)}
          onSubmitted={() => {
            setRatedIds(prev => new Set([...prev, ratingTarget.requestId]))
            setRatingTarget(null)
          }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 5: Fix `WithdrawButton` in sent tab — update `requests/page.tsx` sent tab to use `WithdrawButton`**

In the `RequestsWithRating` component above, the `WithdrawButton` for pending sent requests needs to be handled. Update the component to accept an optional `WithdrawButtonComponent`:

Actually, the simpler fix: the sent tab in `requests/page.tsx` previously had inline `WithdrawButton`. Restore it by passing `withdrawable` to `RequestsWithRating`. Update `RequestsWithRating.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { RatingModal } from '@/components/RatingModal'
import { WithdrawButton } from './RequestActions'
import type { ConnectionRequest } from '@/types/partners'

interface Props {
  requests: (ConnectionRequest & { availability: { available_date: string } | null })[]
  isRateable: (r: ConnectionRequest & { availability: { available_date: string } | null }) => boolean
  otherPartyKey: 'requester' | 'recipient'
  statusBadge: Record<string, string>
  displayName: (name: string | null) => string
  showWithdraw?: boolean
}

export function RequestsWithRating({ requests, isRateable, otherPartyKey, statusBadge, displayName, showWithdraw }: Props) {
  const [ratingTarget, setRatingTarget] = useState<{
    requestId: string
    rateeId: string
    rateeName: string
  } | null>(null)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())

  return (
    <>
      <div className="space-y-2">
        {requests.map(r => {
          const otherParty = (r as any)[otherPartyKey]
          const name = displayName(otherParty?.full_name ?? null)
          const rateable = isRateable(r) && !ratedIds.has(r.id)
          const otherPartyId = otherPartyKey === 'requester' ? r.requester_id : r.recipient_id

          return (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3"
            >
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">{name}</p>
                {r.availability?.available_date && (
                  <p className="text-[#8FA889] text-xs">
                    {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                      'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[r.status] ?? 'bg-white/10 text-[#8FA889]'}`}>
                  {r.status}
                </span>
                {showWithdraw && r.status === 'pending' && <WithdrawButton requestId={r.id} />}
                {rateable && (
                  <button
                    onClick={() => setRatingTarget({ requestId: r.id, rateeId: otherPartyId, rateeName: name })}
                    className="text-xs font-medium text-[#E0A800] hover:text-white px-2 py-1 rounded border border-[#E0A800]/30 hover:border-white/30 transition-colors"
                  >
                    ★ Rate
                  </button>
                )}
                {ratedIds.has(r.id) && (
                  <span className="text-xs text-[#52B788]">Rated ✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {ratingTarget && (
        <RatingModal
          connectionRequestId={ratingTarget.requestId}
          rateeId={ratingTarget.rateeId}
          rateeName={ratingTarget.rateeName}
          onClose={() => setRatingTarget(null)}
          onSubmitted={() => {
            setRatedIds(prev => new Set([...prev, ratingTarget.requestId]))
            setRatingTarget(null)
          }}
        />
      )}
    </>
  )
}
```

And update the `sent` tab usage in `requests/page.tsx` to pass `showWithdraw`:

```typescript
// In the sent tab section of requests/page.tsx, change:
<RequestsWithRating
  requests={sentRequests}
  isRateable={isRateable}
  otherPartyKey="recipient"
  statusBadge={STATUS_BADGE}
  displayName={displayName}
  showWithdraw  // ← add this prop
/>
```

- [ ] **Step 6: Run type check**

```bash
npx tsc --noEmit 2>&1 | grep -v "src/test/"
```

Expected: no output.

- [ ] **Step 7: Run all tests**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all passing.

- [ ] **Step 8: Commit**

```bash
git add src/components/RatingModal.tsx src/app/app/partners/requests/ src/app/app/partners/actions.ts
git commit -m "feat(partners): add post-round star ratings with RatingModal"
```

---

## Final Check

After all 6 tasks are complete:

```bash
npx tsc --noEmit 2>&1 | grep -v "src/test/"
npx vitest run 2>&1 | tail -5
```

Both must pass cleanly before merging to main.
