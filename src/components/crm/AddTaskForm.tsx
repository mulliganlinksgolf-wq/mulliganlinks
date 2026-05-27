'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/app/actions/crm/tasks'
import type { CrmAssignee, CrmRecordType } from '@/lib/crm/types'

interface Props {
  recordType?: CrmRecordType
  recordId?: string
  defaultAssignee?: CrmAssignee
  compact?: boolean
}

export function AddTaskForm({ recordType, recordId, defaultAssignee = 'neil', compact = false }: Props) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState<CrmAssignee>(defaultAssignee)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({
        title: title.trim(),
        record_type: recordType ?? null,
        record_id: recordId ?? null,
        assigned_to: assignee,
        due_date: dueDate || null,
      })
      setTitle('')
      setDueDate('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className={`flex gap-2 ${compact ? '' : 'flex-wrap'}`}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to happen?"
        className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
      />
      <select
        value={assignee}
        onChange={(e) => setAssignee(e.target.value as CrmAssignee)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
      >
        <option value="neil">Neil</option>
        <option value="billy">Billy</option>
      </select>
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add'}
      </button>
    </form>
  )
}
