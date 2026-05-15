'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { EmailComposerModal } from '@/components/crm/EmailComposerModal'
import { resetTodaysQueue } from '@/app/actions/crm/outreach-queue'
import type { CrmCourse } from '@/lib/crm/types'

function parseNote(notes: string | null | undefined, key: string): string | null {
  if (!notes) return null
  const m = notes.match(new RegExp(key + ': ([^|]+)'))
  return m ? m[1].trim() : null
}

interface Props {
  courses: CrmCourse[]
}

export function OutreachQueueClient({ courses }: Props) {
  const router = useRouter()
  const [done, setDone] = useState<Set<string>>(new Set())
  const [activityTarget, setActivityTarget] = useState<CrmCourse | null>(null)
  const [emailTarget, setEmailTarget] = useState<CrmCourse | null>(null)
  const [resetting, setResetting] = useState(false)

  function markDone(id: string) {
    setDone(prev => new Set([...prev, id]))
  }

  async function handleReset() {
    setResetting(true)
    await resetTodaysQueue()
    router.refresh()
    setDone(new Set())
    setResetting(false)
  }

  const remaining = courses.filter(c => !done.has(c.id))
  const completed = courses.filter(c => done.has(c.id))

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs text-slate-400 hover:text-slate-600 underline disabled:opacity-50"
        >
          {resetting ? 'Refreshing…' : 'Get new queue'}
        </button>
      </div>

      {remaining.length === 0 && courses.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <p className="text-emerald-700 font-semibold text-lg">All done for today!</p>
          <p className="text-sm text-emerald-600 mt-1">You've worked through all {courses.length} leads. Check back tomorrow for a fresh queue.</p>
        </div>
      )}

      {remaining.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{remaining.length} remaining</p>
          {remaining.map((course, i) => (
            <QueueCard
              key={course.id}
              course={course}
              index={i + 1}
              onLogActivity={() => setActivityTarget(course)}
              onSendEmail={() => setEmailTarget(course)}
              onMarkDone={() => markDone(course.id)}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2 mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{completed.length} completed this session</p>
          {completed.map(course => (
            <div key={course.id} className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 opacity-50">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-slate-600">{course.name}</span>
            </div>
          ))}
        </div>
      )}

      {activityTarget && (
        <LogActivityModal
          recordType="course"
          recordId={activityTarget.id}
          assignee={activityTarget.assigned_to ?? 'neil'}
          onClose={() => setActivityTarget(null)}
          onLogged={() => {
            markDone(activityTarget.id)
            setActivityTarget(null)
            router.refresh()
          }}
        />
      )}

      {emailTarget && (
        <EmailComposerModal
          recordType="course"
          recordId={emailTarget.id}
          toEmail={emailTarget.contact_email}
          sentBy={emailTarget.assigned_to ?? 'neil'}
          variables={{ name: emailTarget.contact_name ?? '', course_name: emailTarget.name ?? '' }}
          onClose={() => setEmailTarget(null)}
          onSent={() => {
            markDone(emailTarget.id)
            setEmailTarget(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

interface CardProps {
  course: CrmCourse
  index: number
  onLogActivity: () => void
  onSendEmail: () => void
  onMarkDone: () => void
}

function QueueCard({ course, index, onLogActivity, onSendEmail, onMarkDone }: CardProps) {
  const metro = parseNote(course.notes, 'Metro Detroit')
  const tier = parseNote(course.notes, 'Outreach Tier')
  const software = course.current_software ?? parseNote(course.notes, 'Software')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4 hover:border-slate-300 transition-colors">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center">
        {index}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/admin/crm/courses/${course.id}`}
              className="font-semibold text-slate-800 hover:text-emerald-700 text-sm"
            >
              {course.name}
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {metro === 'Yes' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Metro Detroit</span>
              )}
              {tier && (
                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{tier.split(' — ')[0]}</span>
              )}
              {software && (
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{software}</span>
              )}
              {course.city && course.state && (
                <span className="text-xs text-slate-400">{course.city}, {course.state}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {course.contact_name && <span className="font-medium text-slate-600">{course.contact_name}</span>}
          {course.contact_email && (
            <a href={`mailto:${course.contact_email}`} className="text-emerald-600 hover:underline">
              {course.contact_email}
            </a>
          )}
          {course.contact_phone && <span>{course.contact_phone}</span>}
          {!course.contact_email && !course.contact_name && (
            <span className="text-amber-500 italic">No contact info</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onLogActivity}
          className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          Log
        </button>
        {course.contact_email && (
          <button
            onClick={onSendEmail}
            className="text-xs px-2.5 py-1.5 border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-50"
          >
            Email
          </button>
        )}
        <button
          onClick={onMarkDone}
          className="text-xs px-2.5 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
        >
          Done ✓
        </button>
      </div>
    </div>
  )
}
