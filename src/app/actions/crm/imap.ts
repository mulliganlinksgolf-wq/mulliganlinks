'use server'

import { createClient } from '@/lib/supabase/server'
import { syncAllMailboxes } from '@/lib/crm/imap-sync'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

export async function triggerImapSync() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Unauthorized')
  }

  const results = await syncAllMailboxes()
  const totalLogged = Object.values(results).reduce((s, r) => s + r.logged, 0)
  const totalSkipped = Object.values(results).reduce((s, r) => s + r.skipped, 0)
  const allErrors = Object.entries(results).flatMap(([mb, r]) => r.errors.map(e => `${mb}: ${e}`))

  revalidatePath('/admin/crm/email-performance')
  return { totalLogged, totalSkipped, errors: allErrors }
}
