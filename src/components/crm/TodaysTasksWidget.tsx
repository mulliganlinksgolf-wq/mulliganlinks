import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { TaskItem } from './TaskItem'
import { AddTaskForm } from './AddTaskForm'
import type { CrmTask } from '@/lib/crm/types'

interface TaskWithRecord extends CrmTask {
  record_title: string | null
}

async function loadTodaysTasks(): Promise<TaskWithRecord[]> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: tasks } = await admin
    .from('crm_tasks')
    .select('*')
    .is('completed_at', null)
    .or(`due_date.lte.${today},due_date.is.null`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  if (!tasks?.length) return []

  const courseIds = tasks.filter(t => t.record_type === 'course' && t.record_id).map(t => t.record_id!)
  const outingIds = tasks.filter(t => t.record_type === 'outing' && t.record_id).map(t => t.record_id!)
  const memberIds = tasks.filter(t => t.record_type === 'member' && t.record_id).map(t => t.record_id!)

  const [courses, outings, members] = await Promise.all([
    courseIds.length ? admin.from('crm_courses').select('id, name').in('id', courseIds) : Promise.resolve({ data: [] }),
    outingIds.length ? admin.from('crm_outings').select('id, contact_name').in('id', outingIds) : Promise.resolve({ data: [] }),
    memberIds.length ? admin.from('crm_members').select('id, name').in('id', memberIds) : Promise.resolve({ data: [] }),
  ])

  const titleMap = new Map<string, string>()
  for (const c of courses.data ?? []) titleMap.set(c.id, c.name)
  for (const o of outings.data ?? []) titleMap.set(o.id, o.contact_name)
  for (const m of members.data ?? []) titleMap.set(m.id, m.name)

  return tasks.map(t => ({ ...t, record_title: t.record_id ? titleMap.get(t.record_id) ?? null : null }))
}

export async function TodaysTasksWidget() {
  const tasks = await loadTodaysTasks()

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Your Inbox</h2>
        <Link href="/admin/crm/tasks" className="text-xs text-emerald-700 hover:underline">View all →</Link>
      </div>
      <div className="mb-3">
        <AddTaskForm compact />
      </div>
      {tasks.length === 0 ? (
        <div className="text-sm text-slate-400 italic py-4 text-center">Nothing on your plate. Nice.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => <TaskItem key={t.id} task={t} recordTitle={t.record_title} />)}
        </div>
      )}
    </div>
  )
}
