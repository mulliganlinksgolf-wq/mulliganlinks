'use client'

import { useState } from 'react'
import { TaskItem } from './TaskItem'
import { AddTaskForm } from './AddTaskForm'
import type { CrmTask, CrmRecordType, CrmAssignee } from '@/lib/crm/types'

interface Props {
  recordType: CrmRecordType
  recordId: string
  tasks: CrmTask[]
  defaultAssignee?: CrmAssignee
}

export function RecordTasksSection({ recordType, recordId, tasks, defaultAssignee = 'neil' }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const open = tasks.filter(t => !t.completed_at)
  const done = tasks.filter(t => t.completed_at)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
          Tasks {open.length > 0 && <span className="text-slate-400 font-normal">({open.length})</span>}
        </h3>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>
      {showAdd && (
        <div className="mb-3">
          <AddTaskForm recordType={recordType} recordId={recordId} defaultAssignee={defaultAssignee} compact />
        </div>
      )}
      {open.length === 0 && done.length === 0 && !showAdd ? (
        <p className="text-xs text-slate-400 italic">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {open.map(t => <TaskItem key={t.id} task={t} />)}
          {done.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                {done.length} completed
              </summary>
              <div className="space-y-2 mt-2">
                {done.map(t => <TaskItem key={t.id} task={t} />)}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
