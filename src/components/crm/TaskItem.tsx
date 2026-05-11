'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { completeTask, uncompleteTask, deleteTask } from '@/app/actions/crm/tasks'
import type { CrmTask } from '@/lib/crm/types'

interface Props {
  task: CrmTask
  recordTitle?: string | null
}

function dueLabel(due: string | null): { label: string; tone: 'red' | 'amber' | 'slate' | 'green' } {
  if (!due) return { label: 'No due date', tone: 'slate' }
  const dueDate = new Date(due + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, tone: 'red' }
  if (diffDays === 0) return { label: 'Today', tone: 'amber' }
  if (diffDays === 1) return { label: 'Tomorrow', tone: 'amber' }
  if (diffDays <= 7) return { label: `In ${diffDays}d`, tone: 'slate' }
  return { label: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tone: 'slate' }
}

const TONE_CLASSES = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
} as const

export function TaskItem({ task, recordTitle }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const completed = !!task.completed_at
  const due = dueLabel(task.due_date)

  function toggle() {
    startTransition(async () => {
      if (completed) await uncompleteTask(task.id)
      else await completeTask(task.id)
      router.refresh()
    })
  }

  function remove() {
    if (!confirm('Delete this task?')) return
    startTransition(async () => {
      await deleteTask(task.id)
      router.refresh()
    })
  }

  const recordHref = task.record_type && task.record_id
    ? `/admin/crm/${task.record_type}s/${task.record_id}`
    : null

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
      <button
        onClick={toggle}
        disabled={pending}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-emerald-500'}`}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed && <span className="text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {task.title}
        </div>
        {task.notes && (
          <div className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{task.notes}</div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {!completed && (
            <span className={`text-xs px-2 py-0.5 rounded border ${TONE_CLASSES[due.tone]}`}>
              {due.label}
            </span>
          )}
          <span className="text-xs text-slate-400">@{task.assigned_to}</span>
          {recordHref && recordTitle && (
            <Link href={recordHref} className="text-xs text-emerald-700 hover:underline">
              {recordTitle}
            </Link>
          )}
        </div>
      </div>
      <button
        onClick={remove}
        disabled={pending}
        className="text-xs text-slate-400 hover:text-red-500 px-2 py-1"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  )
}
