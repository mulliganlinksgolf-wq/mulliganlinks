'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { createPost, createIdea, deletePost, editPost, BUFFER_CACHE_TAG } from '@/lib/buffer'
import { revalidatePath, updateTag } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { user }
}

export async function schedulePost(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()

    const text = formData.get('text') as string
    const channelsRaw = formData.get('channels') as string
    const dueAt = formData.get('dueAt') as string | null
    const mode = (formData.get('mode') as string) || 'addToQueue'
    const mediaUrlsRaw = formData.get('mediaUrls') as string | null

    const channels: { id: string; service: 'instagram' | 'facebook' | 'linkedin' | 'twitter' }[] = JSON.parse(channelsRaw)
    const mediaUrls: string[] | undefined = mediaUrlsRaw ? JSON.parse(mediaUrlsRaw) : undefined

    await createPost({
      text,
      channels,
      dueAt: dueAt || undefined,
      mode: mode as 'addToQueue' | 'customScheduled',
      mediaUrls,
    })

    await writeAuditLog({
      eventType: 'social_post_scheduled',
      targetType: 'social',
      details: {
        channelCount: channels.length,
        dueAt: dueAt || null,
        textPreview: text.slice(0, 60),
      },
    })

    updateTag(BUFFER_CACHE_TAG)
    revalidatePath('/admin/social')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateScheduledPost(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()

    const postId = formData.get('postId') as string
    const text = formData.get('text') as string
    const service = formData.get('service') as 'instagram' | 'facebook' | 'linkedin' | 'twitter'
    const dueAt = formData.get('dueAt') as string | null
    const mode = (formData.get('mode') as string) || 'customScheduled'
    const mediaUrlsRaw = formData.get('mediaUrls') as string | null

    const mediaUrls: string[] | undefined = mediaUrlsRaw ? JSON.parse(mediaUrlsRaw) : undefined

    if (!postId) return { success: false, error: 'Missing post id' }

    await editPost({
      postId,
      text,
      service,
      dueAt: dueAt || undefined,
      mode: mode as 'addToQueue' | 'customScheduled',
      mediaUrls,
    })

    await writeAuditLog({
      eventType: 'social_post_scheduled',
      targetType: 'social',
      details: { postId, edited: true, dueAt: dueAt || null, textPreview: text.slice(0, 60) },
    })

    updateTag(BUFFER_CACHE_TAG)
    revalidatePath('/admin/social')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function saveIdea(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()

    const title = formData.get('title') as string
    const text = formData.get('text') as string
    const orgId = process.env.BUFFER_ORG_ID ?? ''

    if (!orgId) return { success: false, error: 'BUFFER_ORG_ID not configured' }

    await createIdea(orgId, title, text)

    await writeAuditLog({
      eventType: 'social_idea_saved',
      targetType: 'social',
      details: { title },
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteScheduledPost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()
    if (!postId) return { success: false, error: 'Missing post id' }

    await deletePost(postId)

    await writeAuditLog({
      eventType: 'social_post_deleted',
      targetType: 'social',
      details: { postId },
    })

    updateTag(BUFFER_CACHE_TAG)
    revalidatePath('/admin/social')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
