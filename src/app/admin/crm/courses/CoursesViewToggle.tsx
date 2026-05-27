'use client'

import { useRouter } from 'next/navigation'

interface Props {
  currentView: string
}

export default function CoursesViewToggle({ currentView }: Props) {
  const router = useRouter()
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
      <button
        onClick={() => router.push('?view=kanban')}
        className={`px-3 py-1.5 font-medium transition-colors
          ${currentView === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Kanban
      </button>
      <button
        onClick={() => router.push('?view=table')}
        className={`px-3 py-1.5 font-medium transition-colors border-l border-slate-200
          ${currentView === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Table
      </button>
    </div>
  )
}
