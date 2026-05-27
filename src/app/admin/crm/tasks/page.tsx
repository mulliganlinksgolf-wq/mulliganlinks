export const metadata = { title: 'CRM Tasks' }
export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { TaskItem } from '@/components/crm/TaskItem'
import { AddTaskForm } from '@/components/crm/AddTaskForm'
import type { CrmTask } from '@/lib/crm/types'

interface TaskWithRecord extends CrmTask {
  record_title: string | null
}

async function loadTasks(): Promise<TaskWithRecord[]> {
  const admin = createAdminClient()
  const { data: tasks } = await admin
    .from('crm_tasks')
    .select('*')
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('due_date', { ascending: true, nullsFirst: false })

  if (!tasks?.length) return []

  // Collect record titles in batch
  const courseIds = tasks.filter(t => t.record_type === 'course' && t.record_id).map(t => t.record_id!)
  const outingIds = tasks.filter(t => t.record_type === 'outing' && t.record_id).map(t => t.record_id!)
  const memberIds = tasks.filter(t => t.record_type === 'member' && t.record_id).map(t => t.record_id!)

  const [courses, outings, members] = await Promise.all([
    courseIds.length
      ? admin.from('crm_courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] }),
    outingIds.length
      ? admin.from('crm_outings').select('id, contact_name').in('id', outingIds)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? admin.from('crm_members').select('id, name').in('id', memberIds)
      : Promise.resolve({ data: [] }),
  ])

  const titleMap = new Map<string, string>()
  for (const c of courses.data ?? []) titleMap.set(c.id, c.name)
  for (const o of outings.data ?? []) titleMap.set(o.id, o.contact_name)
  for (const m of members.data ?? []) titleMap.set(m.id, m.name)

  return tasks.map(t => ({ ...t, record_title: t.record_id ? titleMap.get(t.record_id) ?? null : null }))
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default async function TasksPage() {
  const tasks = await loadTasks()
  const today = todayISO()

  const overdue = tasks.filter(t => !t.completed_at && t.due_date && t.due_date < today)
  const dueToday = tasks.filter(t => !t.completed_at && t.due_date === today)
  const upcoming = tasks.filter(t => !t.completed_at && t.due_date && t.due_date > today)
  const noDate = tasks.filter(t => !t.completed_at && !t.due_date)
  const done = tasks.filter(t => t.completed_at).slice(0, 30)

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">Follow-ups and to-dos across the CRM.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <AddTaskForm />
      </div>

      {overdue.length > 0 && (
        <Section title="Overdue" count={overdue.length} tone="red">
          {overdue.map(t => <TaskItem key={t.id} task={t} recordTitle={t.record_title} />)}
        </Section>
      )}

      <Section title="Due today" count={dueToday.length} tone="amber">
        {dueToday.length === 0 ? <Empty>Nothing due today.</Empty> : dueToday.map(t => <TaskItem key={t.id} task={t} recordTitle={t.record_title} />)}
      </Section>

      {upcoming.length > 0 && (
        <Section title="Upcoming" count={upcoming.length}>
          {upcoming.map(t => <TaskItem key={t.id} task={t} recordTitle={t.record_title} />)}
        </Section>
      )}

      {noDate.length > 0 && (
        <Section title="No due date" count={noDate.length}>
          {noDate.map(t => <TaskItem key={t.id} task={t} recordTitle={t.record_title} />)}
        </Section>
      )}

      {done.length > 0 && (
        <Section title="Recently completed" count={done.length}>
          {done.map(t => <TaskItem key={t.id} task={t} recordTitle={t.record_title} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, tone, children }: { title: string; count: number; tone?: 'red' | 'amber'; children: React.ReactNode }) {
  const titleClass = tone === 'red' ? 'text-red-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-700'
  return (
    <div className="space-y-2">
      <h2 className={`text-sm font-semibold uppercase tracking-wide ${titleClass}`}>
        {title} <span className="text-slate-400 font-normal">({count})</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-slate-400 italic px-3 py-4">{children}</div>
}
