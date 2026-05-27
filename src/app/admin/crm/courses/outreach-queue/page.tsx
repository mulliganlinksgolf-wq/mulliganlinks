export const metadata = { title: 'Daily Outreach Queue' }
export const dynamic = 'force-dynamic'

import { getTodaysQueue } from '@/app/actions/crm/outreach-queue'
import { OutreachQueueClient } from './OutreachQueueClient'
import Link from 'next/link'

export default async function OutreachQueuePage() {
  const courses = await getTodaysQueue()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Outreach Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today} · {courses.length} leads to contact today</p>
        </div>
        <Link
          href="/admin/crm/courses"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to Pipeline
        </Link>
      </div>

      <OutreachQueueClient courses={courses} />
    </div>
  )
}
