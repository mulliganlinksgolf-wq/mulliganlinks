'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { KbArticle } from '@/types/knowledge-base'

export type KbSearchResult = Pick<KbArticle, 'id' | 'title' | 'slug' | 'category_id' | 'excerpt'> & {
  kb_categories: { title: string; slug: string } | null
}

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

// ── Course-facing ──────────────────────────────────────────────────────────────

export async function searchKbArticles(query: string): Promise<KbSearchResult[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('kb_articles')
    .select('id, title, slug, category_id, excerpt, kb_categories(title, slug)')
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('sort_order')
    .limit(10)
  return (data ?? []) as KbSearchResult[]
}

export async function voteKbArticle(articleId: string, vote: 'yes' | 'no'): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc('vote_kb_article', { p_article_id: articleId, p_vote: vote })
  if (error) throw new Error(error.message)
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────────

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
