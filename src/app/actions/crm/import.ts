'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']
const VALID_STAGES = ['lead','contacted','demo','negotiating','partner','churned']
const VALID_ASSIGNEES = ['neil','billy']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

export interface CsvCourseRow {
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: string
  assigned_to: string | null
  notes: string | null
}

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export async function importCourses(rows: CsvCourseRow[]): Promise<ImportResult> {
  const { admin, user } = await assertAdmin()

  const defaultAssignee = user.email === 'beslock@yahoo.com' ? 'billy' : 'neil'

  // Fetch existing contact emails to deduplicate
  const emailsToCheck = rows
    .map(r => r.contact_email)
    .filter((e): e is string => !!e)

  const { data: existing } = await admin
    .from('crm_courses')
    .select('contact_email')
    .in('contact_email', emailsToCheck)

  const existingEmails = new Set(existing?.map(r => r.contact_email) ?? [])

  const toInsert: object[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.name.trim()) {
      errors.push(`Row ${i + 1}: missing course name`)
      continue
    }
    if (row.contact_email && existingEmails.has(row.contact_email)) {
      skipped++
      continue
    }

    const stage = VALID_STAGES.includes(row.stage) ? row.stage : 'lead'
    const assignedTo = VALID_ASSIGNEES.includes(row.assigned_to ?? '') ? row.assigned_to : defaultAssignee

    toInsert.push({
      name: row.name.trim(),
      contact_name: row.contact_name || null,
      contact_email: row.contact_email || null,
      contact_phone: row.contact_phone || null,
      stage,
      assigned_to: assignedTo,
      notes: row.notes || null,
      last_activity_at: new Date().toISOString(),
    })
  }

  if (toInsert.length > 0) {
    const { error } = await admin.from('crm_courses').insert(toInsert)
    if (error) return { created: 0, skipped, errors: [error.message] }
  }

  return { created: toInsert.length, skipped, errors }
}
