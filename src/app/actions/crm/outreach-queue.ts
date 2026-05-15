'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CrmCourse } from '@/lib/crm/types'

const QUEUE_SIZE = 20

export async function getTodaysQueue(): Promise<CrmCourse[]> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // First: return today's already-generated queue if it exists
  const { data: existing } = await admin
    .from('crm_courses')
    .select('*')
    .eq('outreach_queued_date', today)
    .eq('stage', 'lead')
    .order('name')

  if (existing && existing.length > 0) return existing as CrmCourse[]

  // Generate a new queue: pick QUEUE_SIZE leads prioritized by
  // Metro Detroit → Tier 1 → has contact email → oldest
  const { data: candidates } = await admin
    .from('crm_courses')
    .select('*')
    .eq('stage', 'lead')
    .is('outreach_queued_date', null)
    .order('name')

  if (!candidates || candidates.length === 0) {
    // All leads have been queued before — reset and start over
    const { data: allLeads } = await admin
      .from('crm_courses')
      .select('*')
      .eq('stage', 'lead')
      .order('name')
    if (!allLeads || allLeads.length === 0) return []
    return sortByPriority(allLeads as CrmCourse[]).slice(0, QUEUE_SIZE)
  }

  const sorted = sortByPriority(candidates as CrmCourse[])
  const selected = sorted.slice(0, QUEUE_SIZE)

  // Stamp today's date on the selected courses
  const ids = selected.map(c => c.id)
  await admin
    .from('crm_courses')
    .update({ outreach_queued_date: today })
    .in('id', ids)

  return selected
}

function parseNote(notes: string | null | undefined, key: string): string | null {
  if (!notes) return null
  const m = notes.match(new RegExp(key + ': ([^|]+)'))
  return m ? m[1].trim() : null
}

function sortByPriority(courses: CrmCourse[]): CrmCourse[] {
  return [...courses].sort((a, b) => {
    // 1. Metro Detroit first
    const aMetro = parseNote(a.notes, 'Metro Detroit') === 'Yes' ? 0 : 1
    const bMetro = parseNote(b.notes, 'Metro Detroit') === 'Yes' ? 0 : 1
    if (aMetro !== bMetro) return aMetro - bMetro

    // 2. Tier 1 before Tier 2 before Tier 3/none
    const tierRank = (n: CrmCourse) => {
      const t = parseNote(n.notes, 'Outreach Tier')
      if (!t) return 9
      if (t.includes('Tier 1')) return 1
      if (t.includes('Tier 2')) return 2
      if (t.includes('Tier 3')) return 3
      return 9
    }
    const tDiff = tierRank(a) - tierRank(b)
    if (tDiff !== 0) return tDiff

    // 3. Has contact email
    const aEmail = a.contact_email ? 0 : 1
    const bEmail = b.contact_email ? 0 : 1
    if (aEmail !== bEmail) return aEmail - bEmail

    // 4. Oldest last_activity_at first (longest ignored)
    return new Date(a.last_activity_at).getTime() - new Date(b.last_activity_at).getTime()
  })
}
