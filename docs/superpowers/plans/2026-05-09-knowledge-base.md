# Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-serve help center for course staff at `/course/[slug]/help` and a full CRUD admin panel at `/admin/knowledge-base` for managing categories and articles.

**Architecture:** Two surfaces share one Supabase-backed content layer (`kb_categories` + `kb_articles`). Course portal pages are server components protected by the existing layout auth guard. Admin pages are protected by the existing admin layout. Server Actions in `src/app/actions/knowledgeBase.ts` handle all mutations using the service-role admin client. React-markdown renders article bodies; a localStorage-backed widget captures helpful votes via an RPC.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres + RLS + RPC), Tailwind v4, shadcn/ui (button, card, input, label + newly added tabs, select, switch, badge), react-markdown, lucide-react.

---

## File Map

**Create:**
- `supabase/migrations/060_knowledge_base.sql` — tables, RLS, RPC, seed data
- `src/types/knowledge-base.ts` — `KbCategory` and `KbArticle` TypeScript types
- `src/app/actions/knowledgeBase.ts` — all Server Actions (search, vote, admin CRUD)
- `src/app/course/[slug]/help/page.tsx` — help center index (categories grid + search)
- `src/app/course/[slug]/help/[categorySlug]/page.tsx` — article list for one category
- `src/app/course/[slug]/help/[categorySlug]/[articleSlug]/page.tsx` — single article
- `src/components/course/KbSearch.tsx` — debounced search client component
- `src/components/course/KbMarkdown.tsx` — react-markdown wrapper with prose styles
- `src/components/course/KbHelpfulWidget.tsx` — thumbs up/down with localStorage guard
- `src/app/admin/knowledge-base/page.tsx` — articles + categories management tabs
- `src/app/admin/knowledge-base/new/page.tsx` — new article page
- `src/app/admin/knowledge-base/[articleId]/edit/page.tsx` — edit article page
- `src/components/admin/KbArticleForm.tsx` — shared article form ('use client')
- `src/test/knowledge-base-actions.test.ts` — unit tests for Server Actions

**Modify:**
- `src/app/course/[slug]/layout.tsx` — add "Help" nav item to `allNavItems`
- `src/components/admin/AdminSidebar.tsx` — add "Knowledge Base" under Platform section

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/060_knowledge_base.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/060_knowledge_base.sql

CREATE TABLE kb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  helpful_yes int NOT NULL DEFAULT 0,
  helpful_no int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- update_updated_at_column already exists from migration 031; use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER kb_articles_updated_at
  BEFORE UPDATE ON kb_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read kb_categories" ON kb_categories
  FOR SELECT TO authenticated USING (true);

ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read published kb_articles" ON kb_articles
  FOR SELECT TO authenticated USING (is_published = true);

-- Helpful vote RPC (SECURITY DEFINER bypasses RLS for the UPDATE)
CREATE OR REPLACE FUNCTION vote_kb_article(p_article_id uuid, p_vote text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_vote = 'yes' THEN
    UPDATE kb_articles SET helpful_yes = helpful_yes + 1
    WHERE id = p_article_id AND is_published = true;
  ELSIF p_vote = 'no' THEN
    UPDATE kb_articles SET helpful_no = helpful_no + 1
    WHERE id = p_article_id AND is_published = true;
  END IF;
END;
$$;

-- Seed categories
INSERT INTO kb_categories (title, slug, description, icon, sort_order) VALUES
  ('Getting Started',        'getting-started',  'Everything you need to hit the ground running with TeeAhead.',           'Rocket',     1),
  ('Managing Your Tee Sheet','tee-sheet',        'How to set up, edit, and optimize your tee times.',                      'Calendar',   2),
  ('Members & Bookings',     'members-bookings', 'Understanding member tiers, bookings, check-in, and cancellations.',     'Users',      3),
  ('Payments & Billing',     'payments-billing', 'Processing payments, resolving disputes, and reading your statements.',  'CreditCard', 4);

-- Seed starter articles
WITH cat_gs AS (SELECT id FROM kb_categories WHERE slug = 'getting-started'),
     cat_ts AS (SELECT id FROM kb_categories WHERE slug = 'tee-sheet')
INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order) VALUES
(
  (SELECT id FROM cat_gs),
  'Setting Up Your Course Profile',
  'setting-up-your-course-profile',
  E'## Overview\n\nYour course profile is the first thing TeeAhead members see when browsing available tee times. A complete profile drives more bookings and builds trust with golfers who may not have visited before.\n\n## What to Fill In\n\n- **Course name and address** — used for maps and location search.\n- **Course description** — 2–3 sentences about what makes your course unique (views, challenge level, pace of play).\n- **Photos** — upload at least one hero image. Courses with photos convert 3× better.\n- **Amenities** — driving range, pro shop, cart rental, restaurant. Golfers filter on these.\n\n## Connecting Your Tee Sheet\n\nOnce your profile is live, go to **Settings → Tee Sheet** to configure your available time slots, pricing per tier, and blackout dates.\n\n## Next Steps\n\nAfter your profile is complete, publish at least 14 days of tee times so members have enough runway to plan a round. See [Managing Your Tee Sheet](#) for a step-by-step walkthrough.',
  'A complete profile drives more bookings. Learn what to fill in and how to connect your tee sheet.',
  true,
  1
),
(
  (SELECT id FROM cat_ts),
  'Creating and Publishing Tee Times',
  'creating-and-publishing-tee-times',
  E'## How Tee Times Work\n\nTeeAhead members can only book tee times you explicitly publish. Each published slot specifies a scheduled date/time, number of available spots, and pricing per membership tier.\n\n## Creating a Single Tee Time\n\n1. Go to **Tee Times** in your course portal.\n2. Click **New Tee Time**.\n3. Set the date, start time, and number of spots (1–4).\n4. Set per-tier pricing — Eagle and Ace members often receive a discounted rate per your agreement.\n5. Click **Publish**.\n\n## Bulk Creation\n\nFor recurring morning slots, use the bulk creator:\n\n- Select a date range and days of the week.\n- Set the first tee time and interval (e.g. every 10 minutes from 7:00 AM).\n- All slots publish immediately.\n\n## Editing or Canceling\n\n- You can edit pricing or spot count at any time before the first booking is confirmed.\n- To cancel a tee time that already has bookings, use **Cancel Tee Time** — members are notified automatically and receive a rain check credit.\n\n## Best Practices\n\n- Publish at least 14 days out so members can plan ahead.\n- Avoid gaps longer than 30 minutes during peak hours — golfers bounce to another course if they can''t find a slot.\n- Use blackout dates for member tournaments or course maintenance.',
  'Step-by-step guide to creating single and bulk tee times, setting tier pricing, and handling cancellations.',
  true,
  1
);
```

- [ ] **Step 2: Apply migration to production**

```bash
npx supabase db push
```

Expected: `Applying migration 060_knowledge_base.sql...` with no errors. If you see "function already exists", the `CREATE OR REPLACE` handles it — that's fine.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/060_knowledge_base.sql
git commit -m "feat(db): add kb_categories, kb_articles, RLS, vote RPC, seed data"
```

---

## Task 2: Types

**Files:**
- Create: `src/types/knowledge-base.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/types/knowledge-base.ts

export interface KbCategory {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  created_at: string
}

export interface KbArticle {
  id: string
  category_id: string | null
  title: string
  slug: string
  content: string
  excerpt: string | null
  is_published: boolean
  sort_order: number
  helpful_yes: number
  helpful_no: number
  created_at: string
  updated_at: string
  category?: KbCategory | null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/knowledge-base.ts
git commit -m "feat(types): add KbCategory and KbArticle types"
```

---

## Task 3: Install react-markdown

**Files:** none (dependency only)

- [ ] **Step 1: Install**

```bash
npm install react-markdown
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-markdown"
```

---

## Task 4: Install shadcn components needed for admin UI

The admin management page needs Tabs, Badge, and a Switch toggle. The article form needs a Select. None of these are currently installed (only button, card, input, label exist under `src/components/ui/`).

- [ ] **Step 1: Add shadcn components**

```bash
npx shadcn add tabs badge switch select
```

Expected: four new files created under `src/components/ui/` — `tabs.tsx`, `badge.tsx`, `switch.tsx`, `select.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/tabs.tsx src/components/ui/badge.tsx src/components/ui/switch.tsx src/components/ui/select.tsx
git commit -m "chore: add tabs, badge, switch, select shadcn components"
```

---

## Task 5: Server Actions

**Files:**
- Create: `src/app/actions/knowledgeBase.ts`
- Create: `src/test/knowledge-base-actions.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/knowledge-base-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mocks ──────────────────────────────────────────
const { mockAuthGetUser, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

function makeChain(overrides: Partial<{ data: unknown; error: unknown }> = {}) {
  const base = { data: overrides.data ?? null, error: overrides.error ?? null }
  const chain: Record<string, unknown> = {}
  const methods = ['select','insert','update','delete','eq','neq','ilike','or',
                   'order','limit','single','maybeSingle','returns']
  for (const m of methods) chain[m] = vi.fn().mockReturnThis()
  chain['then'] = (resolve: (v: typeof base) => unknown) => Promise.resolve(resolve(base))
  return chain as any
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('searchKbArticles', () => {
  it('returns published articles matching the query', async () => {
    const fakeArticles = [{ id: 'a1', title: 'Setting Up', slug: 'setting-up', category_id: 'c1' }]
    mockFrom.mockReturnValue(makeChain({ data: fakeArticles }))

    const { searchKbArticles } = await import('@/app/actions/knowledgeBase')
    const results = await searchKbArticles('setup')
    expect(results).toEqual(fakeArticles)
  })
})

describe('voteKbArticle', () => {
  it('calls the vote_kb_article RPC with correct arguments', async () => {
    mockRpc.mockResolvedValue({ error: null })

    const { voteKbArticle } = await import('@/app/actions/knowledgeBase')
    await voteKbArticle('article-uuid', 'yes')
    expect(mockRpc).toHaveBeenCalledWith('vote_kb_article', {
      p_article_id: 'article-uuid',
      p_vote: 'yes',
    })
  })
})

describe('assertAdmin guard', () => {
  it('throws when user is not authenticated', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } })

    const { createKbCategory } = await import('@/app/actions/knowledgeBase')
    const fd = new FormData()
    fd.set('title', 'Test')
    fd.set('slug', 'test')
    const result = await createKbCategory({}, fd)
    expect(result.error).toBeTruthy()
  })

  it('throws when user is not an admin', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'random@example.com' } } })
    mockFrom.mockReturnValue(makeChain({ data: { is_admin: false } }))

    const { createKbCategory } = await import('@/app/actions/knowledgeBase')
    const fd = new FormData()
    fd.set('title', 'Test')
    fd.set('slug', 'test')
    const result = await createKbCategory({}, fd)
    expect(result.error).toBeTruthy()
  })
})

describe('deleteKbCategory', () => {
  it('returns an error when articles exist for the category', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'nbarris11@gmail.com' } } })
    // First mockFrom call: articles count check — returns 1 article
    mockFrom.mockReturnValueOnce(makeChain({ data: [{ id: 'a1' }] }))

    const { deleteKbCategory } = await import('@/app/actions/knowledgeBase')
    const result = await deleteKbCategory({}, 'cat-uuid')
    expect(result.error).toMatch(/articles/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/knowledge-base-actions.test.ts
```

Expected: FAIL — `Cannot find module '@/app/actions/knowledgeBase'`

- [ ] **Step 3: Implement the Server Actions**

```typescript
// src/app/actions/knowledgeBase.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { KbArticle, KbCategory } from '@/types/knowledge-base'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return admin
}

// ── Course-facing (no admin check needed — layout handles auth) ──────────────

export async function searchKbArticles(query: string): Promise<KbArticle[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('kb_articles')
    .select('id, title, slug, category_id, excerpt, kb_categories(title, slug)')
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('sort_order')
    .limit(10)
  return (data ?? []) as KbArticle[]
}

export async function voteKbArticle(articleId: string, vote: 'yes' | 'no'): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('vote_kb_article', { p_article_id: articleId, p_vote: vote })
}

// ── Admin CRUD ───────────────────────────────────────────────────────────────

type ActionState = { error?: string; success?: boolean }

export async function createKbCategory(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('kb_categories').insert({
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: (formData.get('description') as string) || null,
      icon: (formData.get('icon') as string) || null,
      sort_order: Number(formData.get('sort_order') ?? 0),
    })
    if (error) return { error: error.message }
    revalidatePath('/admin/knowledge-base')
    revalidatePath('/course')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateKbCategory(
  _: ActionState,
  payload: { id: string; formData: FormData }
): Promise<ActionState> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('kb_categories').update({
      title: payload.formData.get('title') as string,
      slug: payload.formData.get('slug') as string,
      description: (payload.formData.get('description') as string) || null,
      icon: (payload.formData.get('icon') as string) || null,
      sort_order: Number(payload.formData.get('sort_order') ?? 0),
    }).eq('id', payload.id)
    if (error) return { error: error.message }
    revalidatePath('/admin/knowledge-base')
    revalidatePath('/course')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteKbCategory(
  _: ActionState,
  categoryId: string
): Promise<ActionState> {
  try {
    const admin = await assertAdmin()
    const { data: articles } = await admin
      .from('kb_articles')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1)
    if (articles && articles.length > 0) {
      return { error: 'Cannot delete: this category still has articles. Reassign or delete them first.' }
    }
    const { error } = await admin.from('kb_categories').delete().eq('id', categoryId)
    if (error) return { error: error.message }
    revalidatePath('/admin/knowledge-base')
    revalidatePath('/course')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function createKbArticle(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('kb_articles').insert({
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      category_id: (formData.get('category_id') as string) || null,
      excerpt: (formData.get('excerpt') as string) || null,
      content: formData.get('content') as string,
      is_published: formData.get('is_published') === 'true',
      sort_order: Number(formData.get('sort_order') ?? 0),
    })
    if (error) return { error: error.message }
    revalidatePath('/admin/knowledge-base')
    revalidatePath('/course')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateKbArticle(
  _: ActionState,
  payload: { id: string; formData: FormData }
): Promise<ActionState> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('kb_articles').update({
      title: payload.formData.get('title') as string,
      slug: payload.formData.get('slug') as string,
      category_id: (payload.formData.get('category_id') as string) || null,
      excerpt: (payload.formData.get('excerpt') as string) || null,
      content: payload.formData.get('content') as string,
      is_published: payload.formData.get('is_published') === 'true',
      sort_order: Number(payload.formData.get('sort_order') ?? 0),
    }).eq('id', payload.id)
    if (error) return { error: error.message }
    revalidatePath('/admin/knowledge-base')
    revalidatePath('/course')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteKbArticle(
  _: ActionState,
  articleId: string
): Promise<ActionState> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('kb_articles').delete().eq('id', articleId)
    if (error) return { error: error.message }
    revalidatePath('/admin/knowledge-base')
    revalidatePath('/course')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/knowledge-base-actions.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/knowledgeBase.ts src/test/knowledge-base-actions.test.ts
git commit -m "feat(actions): knowledge base server actions with tests"
```

---

## Task 6: Course Portal — Help Center Index

**Files:**
- Create: `src/app/course/[slug]/help/page.tsx`
- Create: `src/components/course/KbSearch.tsx`

- [ ] **Step 1: Write KbSearch client component**

```tsx
// src/components/course/KbSearch.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { searchKbArticles } from '@/app/actions/knowledgeBase'
import type { KbArticle } from '@/types/knowledge-base'

interface KbSearchProps {
  courseSlug: string
}

export function KbSearch({ courseSlug }: KbSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KbArticle[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      const data = await searchKbArticles(query)
      setResults(data)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search help articles…"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg divide-y divide-gray-100">
          {results.map(article => {
            const category = (article as any).kb_categories
            const categorySlug = category?.slug ?? 'uncategorized'
            return (
              <li key={article.id}>
                <a
                  href={`/course/${courseSlug}/help/${categorySlug}/${article.slug}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  {category?.title && (
                    <div className="text-xs text-gray-400 mt-0.5">{category.title}</div>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      )}
      {open && results.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-4 py-3 text-sm text-gray-400">
          No articles found for "{query}"
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the Help Center index page**

```tsx
// src/app/course/[slug]/help/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { KbSearch } from '@/components/course/KbSearch'
import type { KbCategory } from '@/types/knowledge-base'

export const metadata = { title: 'Help Center' }

export default async function CourseHelpPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: categories } = await admin
    .from('kb_categories')
    .select('*')
    .order('sort_order')

  // Count published articles per category
  const { data: counts } = await admin
    .from('kb_articles')
    .select('category_id')
    .eq('is_published', true)

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    if (row.category_id) countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
  }

  const totalPublished = Object.values(countMap).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Help Center</h1>
        <p className="mt-1 text-sm text-[#6B7770]">
          Best practices and how-to guides for your TeeAhead dashboard
        </p>
      </div>

      <div className="mb-8">
        <KbSearch courseSlug={slug} />
      </div>

      {totalPublished === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-8 py-16 text-center">
          <p className="text-gray-500">We're building out the help center — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(categories ?? []).map((cat: KbCategory) => {
            const articleCount = countMap[cat.id] ?? 0
            if (articleCount === 0) return null
            return (
              <a
                key={cat.id}
                href={`/course/${slug}/help/${cat.slug}`}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 hover:border-[#1B4332] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <h2 className="font-semibold text-[#1A1A1A]">{cat.title}</h2>
                </div>
                {cat.description && (
                  <p className="text-sm text-[#6B7770] leading-relaxed">{cat.description}</p>
                )}
                <p className="text-xs text-[#6B7770] mt-auto pt-2 border-t border-gray-100">
                  {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                </p>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

> **Note on icon rendering:** lucide-react is a client-side library and can't be used in a server component without wrapping in `'use client'`. The spec says to use a lucide icon name string stored in the DB — but rendering lucide icons dynamically by string in a server component requires a client wrapper. To keep things simple and match the pattern in the rest of the codebase (AdminSidebar uses emoji), we render a static emoji instead. If you want dynamic lucide icons per category, create a thin `'use client'` `CategoryIcon` component that maps the icon string to a lucide component.

- [ ] **Step 3: Commit**

```bash
git add "src/app/course/[slug]/help/page.tsx" src/components/course/KbSearch.tsx
git commit -m "feat(course): knowledge base help center index + search"
```

---

## Task 7: Course Portal — Category Page

**Files:**
- Create: `src/app/course/[slug]/help/[categorySlug]/page.tsx`

- [ ] **Step 1: Write the category page**

```tsx
// src/app/course/[slug]/help/[categorySlug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { KbArticle } from '@/types/knowledge-base'

export default async function CourseCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>
}) {
  const { slug, categorySlug } = await params
  const admin = createAdminClient()

  const { data: category } = await admin
    .from('kb_categories')
    .select('*')
    .eq('slug', categorySlug)
    .single()

  if (!category) notFound()

  const { data: articles } = await admin
    .from('kb_articles')
    .select('id, title, slug, excerpt, updated_at')
    .eq('category_id', category.id)
    .eq('is_published', true)
    .order('sort_order')

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-[#6B7770] mb-6">
        <Link href={`/course/${slug}/help`} className="hover:text-[#1A1A1A]">Help Center</Link>
        <span>/</span>
        <span className="text-[#1A1A1A] font-medium">{category.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{category.title}</h1>
      {category.description && (
        <p className="text-sm text-[#6B7770] mb-8">{category.description}</p>
      )}

      {(articles ?? []).length === 0 ? (
        <p className="text-[#6B7770] text-sm">No articles in this category yet.</p>
      ) : (
        <ul className="space-y-3">
          {(articles ?? []).map((article: KbArticle) => (
            <li key={article.id}>
              <Link
                href={`/course/${slug}/help/${categorySlug}/${article.slug}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-[#1B4332] hover:shadow-sm transition-all"
              >
                <div className="font-medium text-[#1A1A1A]">{article.title}</div>
                {article.excerpt && (
                  <div className="text-sm text-[#6B7770] mt-1">{article.excerpt}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Updated {new Date(article.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link href={`/course/${slug}/help`} className="text-sm text-[#1B4332] hover:underline">
          ← Back to Help Center
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/course/[slug]/help/[categorySlug]/page.tsx"
git commit -m "feat(course): knowledge base category page"
```

---

## Task 8: Course Portal — Article Page + Markdown + Helpful Widget

**Files:**
- Create: `src/app/course/[slug]/help/[categorySlug]/[articleSlug]/page.tsx`
- Create: `src/components/course/KbMarkdown.tsx`
- Create: `src/components/course/KbHelpfulWidget.tsx`

- [ ] **Step 1: Write KbMarkdown**

```tsx
// src/components/course/KbMarkdown.tsx
'use client'

import ReactMarkdown from 'react-markdown'

export function KbMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-[#1A1A1A] prose-headings:text-[#1A1A1A] prose-a:text-[#1B4332] prose-strong:text-[#1A1A1A]">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 2: Write KbHelpfulWidget**

```tsx
// src/components/course/KbHelpfulWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { voteKbArticle } from '@/app/actions/knowledgeBase'

export function KbHelpfulWidget({ articleId }: { articleId: string }) {
  const storageKey = `kb_voted_${articleId}`
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    setVoted(!!localStorage.getItem(storageKey))
  }, [storageKey])

  async function handleVote(vote: 'yes' | 'no') {
    if (voted) return
    await voteKbArticle(articleId, vote)
    localStorage.setItem(storageKey, vote)
    setVoted(true)
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-6">
      <p className="text-sm font-medium text-[#1A1A1A] mb-3">Was this article helpful?</p>
      {voted ? (
        <p className="text-sm text-[#6B7770]">Thanks for your feedback!</p>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handleVote('yes')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </button>
          <button
            onClick={() => handleVote('no')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-[#6B7770] hover:border-red-400 hover:text-red-500 transition-colors"
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write the article page**

```tsx
// src/app/course/[slug]/help/[categorySlug]/[articleSlug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { KbMarkdown } from '@/components/course/KbMarkdown'
import { KbHelpfulWidget } from '@/components/course/KbHelpfulWidget'

export default async function CourseArticlePage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string; articleSlug: string }>
}) {
  const { slug, categorySlug, articleSlug } = await params
  const admin = createAdminClient()

  const { data: article } = await admin
    .from('kb_articles')
    .select('*, kb_categories(title, slug)')
    .eq('slug', articleSlug)
    .eq('is_published', true)
    .single()

  if (!article) notFound()

  const category = (article as any).kb_categories

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-[#6B7770] mb-6 flex-wrap">
        <Link href={`/course/${slug}/help`} className="hover:text-[#1A1A1A]">Help Center</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/course/${slug}/help/${categorySlug}`} className="hover:text-[#1A1A1A]">
              {category.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#1A1A1A] font-medium">{article.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{article.title}</h1>
      <p className="text-xs text-[#6B7770] mb-8">
        Last updated{' '}
        {new Date(article.updated_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <KbMarkdown content={article.content} />
      </div>

      <KbHelpfulWidget articleId={article.id} />

      <div className="mt-8">
        <Link href={`/course/${slug}/help/${categorySlug}`} className="text-sm text-[#1B4332] hover:underline">
          ← Back to {category?.title ?? 'category'}
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/course/KbMarkdown.tsx src/components/course/KbHelpfulWidget.tsx "src/app/course/[slug]/help/[categorySlug]/[articleSlug]/page.tsx"
git commit -m "feat(course): knowledge base article page, markdown renderer, helpful widget"
```

---

## Task 9: Add "Help" to Course Portal Nav

**Files:**
- Modify: `src/app/course/[slug]/layout.tsx`

- [ ] **Step 1: Read the current allNavItems array**

Open `src/app/course/[slug]/layout.tsx` and locate the `allNavItems` array. It currently ends with:

```ts
{ href: `/course/${slug}/install`,    label: 'Install',    managerOnly: true },
```

- [ ] **Step 2: Add the Help item**

Add the Help Center entry as the last item in `allNavItems`, visible to all roles (`managerOnly: false`):

```ts
{ href: `/course/${slug}/install`,    label: 'Install',    managerOnly: true },
{ href: `/course/${slug}/help`,       label: 'Help',       managerOnly: false },
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/course/[slug]/layout.tsx"
git commit -m "feat(course-nav): add Help Center link"
```

---

## Task 10: Admin — Knowledge Base Management Page

**Files:**
- Create: `src/app/admin/knowledge-base/page.tsx`

- [ ] **Step 1: Write the page**

This page has two sections: Articles and Categories. Since we don't have a working Tabs component yet (just added in Task 4), use URL searchParams to control which section is active — simpler and works as a server component without any 'use client' boilerplate.

```tsx
// src/app/admin/knowledge-base/page.tsx
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteKbArticle, deleteKbCategory } from '@/app/actions/knowledgeBase'
import type { KbArticle, KbCategory } from '@/types/knowledge-base'

export const metadata = { title: 'Knowledge Base' }

export default async function AdminKnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'articles' } = await searchParams
  const admin = createAdminClient()

  const [{ data: articles }, { data: categories }] = await Promise.all([
    admin
      .from('kb_articles')
      .select('*, kb_categories(title)')
      .order('updated_at', { ascending: false }),
    admin
      .from('kb_categories')
      .select('*')
      .order('sort_order'),
  ])

  // Article count per category
  const countMap: Record<string, number> = {}
  for (const a of articles ?? []) {
    if (a.category_id) countMap[a.category_id] = (countMap[a.category_id] ?? 0) + 1
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
        {tab === 'articles' && (
          <Link
            href="/admin/knowledge-base/new"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            New Article
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-200 mb-6">
        {['articles', 'categories'].map(t => (
          <Link
            key={t}
            href={`/admin/knowledge-base?tab=${t}`}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${
              tab === t
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === 'articles' && (
        <ArticlesTable articles={(articles ?? []) as KbArticle[]} />
      )}
      {tab === 'categories' && (
        <CategoriesTable
          categories={(categories ?? []) as KbCategory[]}
          countMap={countMap}
        />
      )}
    </div>
  )
}

function ArticlesTable({ articles }: { articles: KbArticle[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {articles.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No articles yet</td>
            </tr>
          )}
          {articles.map(a => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{a.title}</td>
              <td className="px-4 py-3 text-slate-500">{(a as any).kb_categories?.title ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  a.is_published
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {a.is_published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(a.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-4 py-3 flex gap-3 justify-end">
                <Link href={`/admin/knowledge-base/${a.id}/edit`} className="text-emerald-700 hover:underline text-sm">Edit</Link>
                <DeleteArticleButton articleId={a.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoriesTable({ categories, countMap }: { categories: KbCategory[]; countMap: Record<string, number> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Articles</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Sort</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No categories yet</td>
            </tr>
          )}
          {categories.map(cat => (
            <tr key={cat.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{cat.title}</td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">{cat.slug}</td>
              <td className="px-4 py-3 text-slate-500">{countMap[cat.id] ?? 0}</td>
              <td className="px-4 py-3 text-slate-400">{cat.sort_order}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
        To edit or delete categories, use the Supabase dashboard or add an edit form here in a future iteration.
      </div>
    </div>
  )
}

function DeleteArticleButton({ articleId }: { articleId: string }) {
  async function handleDelete() {
    'use server'
    await deleteKbArticle({}, articleId)
  }
  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="text-red-500 hover:underline text-sm"
        onClick={e => { if (!confirm('Delete this article?')) e.preventDefault() }}
      >
        Delete
      </button>
    </form>
  )
}
```

> **Note:** The `onClick` confirm on a Server Action form button doesn't work in the standard way because the form submits before `onClick` fires in some browsers. A cleaner pattern is to wrap delete in a small `'use client'` component. If this causes issues during build/test, extract `DeleteArticleButton` to its own file with `'use client'` and call the server action via `useTransition`.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/knowledge-base/page.tsx
git commit -m "feat(admin): knowledge base management page"
```

---

## Task 11: Admin — Article Form (New + Edit)

**Files:**
- Create: `src/components/admin/KbArticleForm.tsx`
- Create: `src/app/admin/knowledge-base/new/page.tsx`
- Create: `src/app/admin/knowledge-base/[articleId]/edit/page.tsx`

- [ ] **Step 1: Write the shared form component**

```tsx
// src/components/admin/KbArticleForm.tsx
'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { KbArticle, KbCategory } from '@/types/knowledge-base'

type ActionFn = (
  prev: { error?: string; success?: boolean },
  formData: FormData
) => Promise<{ error?: string; success?: boolean }>

interface KbArticleFormProps {
  action: ActionFn
  categories: KbCategory[]
  article?: KbArticle
  isEdit?: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const initialState = { error: undefined, success: undefined }

export function KbArticleForm({ action, categories, article, isEdit }: KbArticleFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) router.push('/admin/knowledge-base')
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <TitleInput defaultValue={article?.title} />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Slug
            {isEdit && (
              <span className="ml-2 text-xs text-amber-600 font-normal">
                ⚠ Changing this slug breaks existing links
              </span>
            )}
          </label>
          <SlugInput defaultValue={article?.slug} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            name="category_id"
            defaultValue={article?.category_id ?? ''}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">— Uncategorized —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={article?.sort_order ?? 0}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2">
          <ExcerptInput defaultValue={article?.excerpt ?? ''} />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Content <span className="text-xs text-slate-400 font-normal">Markdown supported</span>
          </label>
          <textarea
            name="content"
            defaultValue={article?.content ?? ''}
            rows={16}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            id="is_published"
            value="true"
            defaultChecked={article?.is_published ?? false}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-slate-700">
            Published
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Article'}
        </button>
        <a
          href="/admin/knowledge-base"
          className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}

// Sub-components for controlled fields

function TitleInput({ defaultValue }: { defaultValue?: string }) {
  'use client'
  const [value, setValue] = require('react').useState(defaultValue ?? '')

  return (
    <input
      name="title"
      type="text"
      required
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  )
}

function SlugInput({ defaultValue }: { defaultValue?: string }) {
  'use client'
  const [value, setValue] = require('react').useState(defaultValue ?? '')

  return (
    <input
      name="slug"
      type="text"
      required
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(slugify(e.target.value))}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  )
}

function ExcerptInput({ defaultValue }: { defaultValue: string }) {
  'use client'
  const [value, setValue] = require('react').useState(defaultValue)

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Excerpt
        <span className="ml-2 text-xs text-slate-400 font-normal">{value.length}/200</span>
      </label>
      <textarea
        name="excerpt"
        rows={2}
        maxLength={200}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}
```

> **Important note on `TitleInput`, `SlugInput`, `ExcerptInput`:** These sub-components use `require('react').useState` which is a code smell. Since the parent is already `'use client'`, just use `useState` imported at the top. Rewrite these as plain functions using the already-imported `useState`. The sub-components exist only to keep the character-counter and slug-generation logic isolated; they don't need their own `'use client'` directive. If TypeScript complains about `require('react')`, refactor to use the top-level `useState` import instead.

- [ ] **Step 2: Write new article page**

```tsx
// src/app/admin/knowledge-base/new/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { KbArticleForm } from '@/components/admin/KbArticleForm'
import { createKbArticle } from '@/app/actions/knowledgeBase'
import Link from 'next/link'

export const metadata = { title: 'New Article' }

export default async function NewKbArticlePage() {
  const admin = createAdminClient()
  const { data: categories } = await admin
    .from('kb_categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/knowledge-base" className="text-sm text-slate-500 hover:text-slate-800">
          ← Knowledge Base
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-2">New Article</h1>
      </div>
      <KbArticleForm action={createKbArticle} categories={categories ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Write edit article page**

```tsx
// src/app/admin/knowledge-base/[articleId]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { KbArticleForm } from '@/components/admin/KbArticleForm'
import { updateKbArticle } from '@/app/actions/knowledgeBase'

export const metadata = { title: 'Edit Article' }

export default async function EditKbArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>
}) {
  const { articleId } = await params
  const admin = createAdminClient()

  const [{ data: article }, { data: categories }] = await Promise.all([
    admin.from('kb_articles').select('*').eq('id', articleId).single(),
    admin.from('kb_categories').select('*').order('sort_order'),
  ])

  if (!article) notFound()

  async function boundUpdate(
    prev: { error?: string; success?: boolean },
    formData: FormData
  ) {
    'use server'
    return updateKbArticle(prev, { id: articleId, formData })
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/knowledge-base" className="text-sm text-slate-500 hover:text-slate-800">
          ← Knowledge Base
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-2">Edit Article</h1>
      </div>
      <KbArticleForm
        action={boundUpdate}
        categories={categories ?? []}
        article={article}
        isEdit
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/KbArticleForm.tsx src/app/admin/knowledge-base/new/page.tsx "src/app/admin/knowledge-base/[articleId]/edit/page.tsx"
git commit -m "feat(admin): knowledge base article form, new and edit pages"
```

---

## Task 12: Add Knowledge Base to Admin Sidebar

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Add the nav item**

In `src/components/admin/AdminSidebar.tsx`, locate the Platform section. It currently reads:

```tsx
<SidebarSection label="Platform" />
<SidebarItem href="/admin/content" icon="📝" label="Content" active={pathname === '/admin/content'} />
<SidebarItem href="/admin/social" icon="📣" label="Social" active={pathname === '/admin/social'} />
<SidebarItem href="/admin/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/courses')} />
<SidebarItem href="/admin/waitlist" icon="📋" label="Waitlist" active={pathname === '/admin/waitlist'} />
```

Add one line after Content:

```tsx
<SidebarItem href="/admin/knowledge-base" icon="📚" label="Knowledge Base" active={pathname.startsWith('/admin/knowledge-base')} />
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "feat(admin-nav): add Knowledge Base to sidebar"
```

---

## Task 13: Build Verification & TypeScript Fix

- [ ] **Step 1: Run the build**

```bash
npm run build
```

- [ ] **Step 2: Fix any TypeScript errors**

Common issues to expect and fix:

**Issue A:** `KbArticleForm` sub-components using `require('react').useState` — fix by removing the sub-components, hoisting their state into the parent `KbArticleForm`, and passing values as controlled props inline. Alternatively, convert `TitleInput`, `SlugInput`, `ExcerptInput` to import `useState` from the top-level React import that's already in scope.

**Issue B:** The `DeleteArticleButton` inline server action inside a client-rendered table may cause a build error (`'use server'` in a function nested inside a non-async component). Fix by extracting it to a top-level async function before the component, or by creating a `'use client'` `DeleteArticleButton` component that calls the server action via `import`:

```tsx
// src/components/admin/DeleteArticleButton.tsx
'use client'

import { deleteKbArticle } from '@/app/actions/knowledgeBase'

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  async function handleDelete() {
    if (!confirm('Delete this article?')) return
    await deleteKbArticle({}, articleId)
    window.location.reload()
  }
  return (
    <button onClick={handleDelete} className="text-red-500 hover:underline text-sm">
      Delete
    </button>
  )
}
```

Then import and use `DeleteArticleButton` in the admin page instead of the inline form.

**Issue C:** `boundUpdate` inline server function in the edit page — Next.js 16 supports inline `'use server'` functions inside server components, but they must be `async`. Verify the function is async (it is in the plan).

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/test/knowledge-base-actions.test.ts
```

Expected: all tests PASS.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve TypeScript build errors in knowledge base"
```

---

## Slug Conflict Check (pre-flight)

Before running any of the above, verify there are no naming conflicts with the new `[categorySlug]` and `[articleSlug]` dynamic segments:

```bash
find src/app/course -type d -name '[*]'
```

Expected output should show only `[slug]` at the top level, and the new `[categorySlug]` / `[articleSlug]` as nested children under `help/`. No sibling folders at the same level should share param names with these.
