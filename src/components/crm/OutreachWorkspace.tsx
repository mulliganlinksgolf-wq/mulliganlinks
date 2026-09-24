'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AddTaskForm } from './AddTaskForm'
import { TaskItem } from './TaskItem'
import { courseTaskMap, filterWorkspaceCourses, isMetroCourse, phoneHref, type WorkspaceCourse, type WorkspaceOwner, type WorkspaceView } from '@/lib/crm/workspace'
import type { CrmAssignee, CrmTask } from '@/lib/crm/types'

const LogActivityModal = dynamic(() => import('./LogActivityModal').then(m => m.LogActivityModal))
const EmailComposerModal = dynamic(() => import('./EmailComposerModal').then(m => m.EmailComposerModal))
const views: [WorkspaceView, string][] = [['all', 'All active'], ['due', 'Follow-ups due'], ['unplanned', 'No next step'], ['new', 'New leads'], ['review', 'Demos & decisions']]
const button = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-600'
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export function OutreachWorkspace({ courses, tasks, today, actor }: { courses: WorkspaceCourse[]; tasks: CrmTask[]; today: string; actor: CrmAssignee }) {
  const router = useRouter()
  const [owner, setOwner] = useState<WorkspaceOwner>('all')
  const [view, setView] = useState<WorkspaceView>('all')
  const [search, setSearch] = useState('')
  const [metroOnly, setMetroOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [logging, setLogging] = useState<WorkspaceCourse | null>(null)
  const [emailing, setEmailing] = useState<WorkspaceCourse | null>(null)
  const taskMap = useMemo(() => courseTaskMap(tasks), [tasks])
  const scope = useMemo(() => filterWorkspaceCourses(courses, tasks, { today, owner, view: 'all', search, metroOnly }), [courses, tasks, today, owner, search, metroOnly])
  const filtered = useMemo(() => filterWorkspaceCourses(scope, tasks, { today, owner: 'all', view, search: '', metroOnly: false }), [scope, tasks, today, view])
  const dueTasks = useMemo(() => {
    const ids = new Set(scope.map(course => course.id))
    return tasks.filter(task => !task.completed_at && task.record_type === 'course' && task.record_id && ids.has(task.record_id) && task.due_date && task.due_date <= today)
      .sort((a, b) => a.due_date!.localeCompare(b.due_date!) || a.title.localeCompare(b.title))
  }, [scope, tasks, today])
  const dueCourses = new Set(dueTasks.map(task => task.record_id)).size
  const lastPage = Math.max(0, Math.ceil(filtered.length / 12) - 1)
  const currentPage = Math.min(page, lastPage)
  const visible = filtered.slice(currentPage * 12, currentPage * 12 + 12)
  function choose(next: WorkspaceView) { setView(next); setPage(0) }
  function reset() { setSearch(''); setOwner('all'); setMetroOnly(false); choose('all') }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-lg font-semibold text-slate-900">Work your course list</h2><p className="mt-1 text-sm text-slate-500">Due follow-ups first, then courses marked Metro Detroit.</p></div>
      <label className="flex items-center gap-2 text-sm text-slate-600">Course owner
        <select value={owner} onChange={event => { setOwner(event.target.value as WorkspaceOwner); setPage(0) }} className={button}>
          <option value="all">Everyone</option><option value="billy">Billy</option><option value="neil">Neil</option><option value="unassigned">Unassigned</option>
        </select>
      </label>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {([
        ['all', 'Active courses', scope.length, 'Your filtered pipeline'],
        ['due', 'Follow-ups due', dueCourses, 'Courses due today or earlier'],
        ['unplanned', 'No next step', scope.filter(course => !taskMap.has(course.id)).length, 'Add a call or follow-up'],
        ['review', 'Demos & decisions', scope.filter(course => ['demo', 'negotiating'].includes(course.stage)).length, 'Keep conversations moving'],
      ] as const).map(([key, label, count, hint]) => <button key={key} onClick={() => choose(key)} aria-pressed={view === key} className={`rounded-2xl border p-4 text-left transition-colors ${view === key ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-400'}`}>
        <span className="block text-sm font-medium text-slate-600">{label}</span><span className="mt-2 block text-3xl font-semibold tracking-tight text-slate-900">{count}</span><span className="mt-1 block text-xs text-slate-500">{hint}</span>
      </button>)}
    </div>
    <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Course outreach list">
        <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <label className="min-w-[180px] flex-1"><span className="sr-only">Search courses or contacts</span><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} placeholder="Search courses, cities or contacts" className="w-full min-w-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-2 focus:outline-emerald-600" /></label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={metroOnly} onChange={event => { setMetroOnly(event.target.checked); setPage(0) }} className="accent-emerald-700" />Marked Metro Detroit</label>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Course views">{views.map(([key, label]) => <button key={key} onClick={() => choose(key)} aria-pressed={view === key} className={`rounded-full px-3 py-1.5 text-sm ${view === key ? 'bg-emerald-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div>
          <div className="flex justify-between gap-3 text-xs text-slate-500"><span aria-live="polite">{filtered.length} {filtered.length === 1 ? 'course' : 'courses'} · Follow-up dates use Detroit time</span><button onClick={reset} className="text-emerald-700 hover:underline">Reset filters</button></div>
        </div>
        <div className="divide-y divide-slate-100">
          {visible.map(course => {
            const next = taskMap.get(course.id)?.[0]
            const due = next?.due_date && next.due_date <= today
            return <article key={course.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0"><Link href={`/admin/crm/courses/${course.id}`} className="break-words text-base font-semibold text-slate-900 hover:text-emerald-700">{course.name}</Link><p className="mt-1 text-xs text-slate-500">{[course.city, course.state].filter(Boolean).join(', ') || 'Location not recorded'} · {course.assigned_to ? course.assigned_to === 'billy' ? 'Billy' : 'Neil' : 'Unassigned'}{isMetroCourse(course) && ' · Metro Detroit'}</p></div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">{course.stage}</span>
              </div>
              <div className="mt-3 grid gap-3 text-sm xl:grid-cols-2">
                <div className="min-w-0"><p className="font-medium text-slate-700">{course.contact_name || 'Decision-maker not recorded'}</p><p className="mt-1 break-words text-xs text-slate-500">{course.contact_phone || 'Phone not recorded'}</p><p className="mt-1 break-all text-xs text-slate-500">{course.contact_email || 'Email not recorded'}</p></div>
                <div className={`rounded-lg p-3 ${due ? 'bg-amber-50' : 'bg-slate-50'}`}><p className={`text-xs font-medium ${due ? 'text-amber-800' : 'text-slate-500'}`}>{next ? next.due_date ? `${next.due_date < today ? 'Overdue · ' : next.due_date === today ? 'Today · ' : 'Next · '}${dateLabel(next.due_date)}` : 'Follow-up needs a date' : 'Set a next step'}</p><p className="mt-1 text-sm text-slate-700">{next ? next.title : 'Choose a call, introduction or follow-up.'}</p>{next && <p className="mt-1 text-xs text-slate-500">Task owner: {next.assigned_to === 'billy' ? 'Billy' : 'Neil'}</p>}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {course.contact_phone && <a href={phoneHref(course.contact_phone)} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900">Call course</a>}
                <button className={button} onClick={() => setLogging(course)}>Log activity</button>
                {course.contact_email && <button className={button} onClick={() => setEmailing(course)}>Write email</button>}
                <Link className={button} href={`/admin/crm/courses/${course.id}`}>Open record →</Link>
              </div>
              <details className="mt-3"><summary className="cursor-pointer py-1 text-sm font-medium text-emerald-700">Add follow-up</summary><div className="pt-3"><AddTaskForm recordType="course" recordId={course.id} defaultAssignee={course.assigned_to ?? actor} /></div></details>
            </article>
          })}
          {!visible.length && <div className="px-5 py-14 text-center"><h3 className="font-semibold text-slate-800">No courses in this view</h3><p className="mt-2 text-sm text-slate-500">Try another view or clear the filters.</p><button onClick={reset} className={`${button} mt-4`}>Show all active courses</button></div>}
        </div>
        {filtered.length > 12 && <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 text-sm"><button className={button} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span className="text-slate-500">{currentPage + 1} / {lastPage + 1}</span><button className={button} disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
      </section>
      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold text-slate-900">Due course tasks</h2><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{dueTasks.length}</span></div><p className="mb-4 mt-1 text-xs leading-5 text-slate-500">Matches your course owner, search and location filters. Includes overdue tasks.</p><div className="space-y-2">{dueTasks.slice(0, 6).map(task => <TaskItem key={task.id} task={task} today={today} recordTitle={scope.find(course => course.id === task.record_id)?.name} />)}{!dueTasks.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No course tasks due in this selection.</p>}</div><Link href="/admin/crm/tasks" className="mt-4 block text-sm font-medium text-emerald-700 hover:underline">Open all tasks →</Link></section>
        <section className="rounded-2xl bg-emerald-950 p-5 text-white"><p className="text-xs font-medium uppercase tracking-wider text-emerald-300">A useful conversation</p><h2 className="mt-2 text-xl font-semibold">Leave with a next step.</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-emerald-50"><li>Confirm who owns the decision. A saved contact is a starting point.</li><li>Ask about one course-specific need and listen.</li><li>Log what you learned and agree on a follow-up date.</li></ol></section>
      </aside>
    </div>
    {logging && <LogActivityModal recordType="course" recordId={logging.id} assignee={actor} onClose={() => setLogging(null)} onLogged={() => router.refresh()} />}
    {emailing && <EmailComposerModal recordType="course" recordId={emailing.id} toEmail={emailing.contact_email} sentBy={actor} variables={{ name: emailing.contact_name ?? '', course_name: emailing.name }} onClose={() => setEmailing(null)} onSent={() => router.refresh()} />}
  </div>
}
