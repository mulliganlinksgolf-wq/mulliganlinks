'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateCourseStage } from '@/app/actions/crm/courses'
import type { CrmCourse, CrmCourseStage } from '@/lib/crm/types'

const STAGES: CrmCourseStage[] = ['lead', 'contacted', 'demo', 'negotiating', 'partner', 'churned']

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

type SortKey = 'name' | 'stage' | 'estimated_value' | 'last_activity_at'

interface Props {
  initialCourses: CrmCourse[]
  onExportCsv: () => void
}

export function CourseTable({ initialCourses, onExportCsv }: Props) {
  const [courses, setCourses] = useState(initialCourses)
  const [sortKey, setSortKey] = useState<SortKey>('last_activity_at')
  const [sortAsc, setSortAsc] = useState(false)

  function sort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = [...courses].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })

  async function handleStageChange(id: string, stage: CrmCourseStage) {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)))
    await updateCourseStage(id, stage)
  }

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 cursor-pointer hover:text-slate-700 select-none"
        onClick={() => sort(k)}
      >
        {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={onExportCsv} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader label="Course" k="name" />
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Contact</th>
              <SortHeader label="Stage" k="stage" />
              <SortHeader label="Value" k="estimated_value" />
              <SortHeader label="Last Activity" k="last_activity_at" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((course) => {
              const days = daysSince(course.last_activity_at)
              return (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2">
                    <Link href={`/admin/crm/courses/${course.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                      {course.name}
                    </Link>
                    {course.city && <div className="text-xs text-slate-400">{course.city}, {course.state}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-slate-700">{course.contact_name ?? '—'}</div>
                    {course.contact_email && <div className="text-xs text-slate-400">{course.contact_email}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={course.stage}
                      onChange={(e) => handleStageChange(course.id, e.target.value as CrmCourseStage)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 capitalize focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {course.estimated_value != null ? `$${course.estimated_value.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={days >= 7 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                      {days === 0 ? 'Today' : `${days}d ago`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">No courses yet.</p>
        )}
      </div>
    </div>
  )
}
