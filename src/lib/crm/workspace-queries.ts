import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CrmTask } from './types'
import type { WorkspaceCourse } from './workspace'

// Paginate explicitly: the database's default row cap must not hide follow-ups.
export async function getWorkspaceData() {
  const db = createAdminClient()
  const size = 500
  async function courses() {
    const rows: WorkspaceCourse[] = []
    for (let offset = 0; ; offset += size) {
      const { data, error } = await db.from('crm_courses')
        .select('id,name,city,state,contact_name,contact_email,contact_phone,stage,assigned_to,notes,last_activity_at')
        .not('stage', 'in', '(partner,churned)').order('id').range(offset, offset + size - 1)
      if (error) throw new Error(error.message)
      rows.push(...(data ?? []) as WorkspaceCourse[])
      if (!data || data.length < size) return rows
    }
  }
  async function tasks() {
    const rows: CrmTask[] = []
    for (let offset = 0; ; offset += size) {
      const { data, error } = await db.from('crm_tasks').select('*')
        .eq('record_type', 'course').is('completed_at', null).order('id').range(offset, offset + size - 1)
      if (error) throw new Error(error.message)
      rows.push(...(data ?? []) as CrmTask[])
      if (!data || data.length < size) return rows
    }
  }
  const [courseRows, taskRows] = await Promise.all([courses(), tasks()])
  return { courses: courseRows, tasks: taskRows }
}
