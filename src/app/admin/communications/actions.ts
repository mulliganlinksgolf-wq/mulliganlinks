'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { sendBroadcast } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

const FILTER_TIERS: Record<string, string[]> = {
  all: ['ace', 'eagle', 'fairway'],
  eagle_ace: ['ace', 'eagle'],
  ace: ['ace'],
  eagle: ['eagle'],
  fairway: ['fairway'],
}

export async function sendBroadcastEmail(formData: FormData): Promise<void> {
  const subject = (formData.get('subject') as string).trim()
  const body = (formData.get('body') as string).trim()
  const filter = (formData.get('filter') as string) || 'all'

  if (!subject) redirect('/admin/communications?error=Subject+is+required.')
  if (!body) redirect('/admin/communications?error=Body+is+required.')

  const { admin, user } = await assertAdmin()

  const tiers = FILTER_TIERS[filter] ?? FILTER_TIERS.all
  const { data: members } = await admin
    .from('memberships')
    .select('tier, profiles(email, full_name)')
    .in('tier', tiers)
    .eq('status', 'active')

  const recipients = (members ?? [])
    .map((m: any) => ({
      email: m.profiles?.email ?? '',
      name: m.profiles?.full_name ?? null,
    }))
    .filter((r: { email: string; name: string | null }) => r.email)

  const html = body
    .split('\n\n')
    .map((p: string) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('')

  const { sent, error: sendError } = await sendBroadcast({ subject, html, recipients })
  if (sendError && sent === 0) redirect(`/admin/communications?error=${encodeURIComponent(sendError)}`)

  await writeAuditLog({
    eventType: 'email_sent',
    targetType: 'communication',
    targetLabel: `Broadcast to ${filter} members`,
    details: { subject, filter, recipient_count: sent, by: user.email },
  })
  revalidatePath('/admin/communications')
  redirect('/admin/communications?sent=1')
}
