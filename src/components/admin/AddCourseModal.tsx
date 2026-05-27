'use client'

import { useState } from 'react'
import { addCourse } from '@/app/admin/courses/inviteActions'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

export default function AddCourseModal() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const result = await addCourse(new FormData(e.currentTarget))
    setStatus(result)
    setLoading(false)
    if (result.success) setTimeout(() => { setOpen(false); setStatus(null) }, 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-[#1B4332] text-[#1B4332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1B4332]/5"
      >
        + Add Course
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1A1A1A]">Add Course Manually</h2>
              <button onClick={() => { setOpen(false); setStatus(null) }} className="text-[#6B7770] hover:text-[#1A1A1A] text-xl leading-none">×</button>
            </div>

            {status?.success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 mb-4">
                Course added successfully.
              </div>
            )}
            {status?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">{status.error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Course Name <span className="text-red-500">*</span></label>
                <input name="name" type="text" required placeholder="e.g. Pebble Beach Golf Links"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">City <span className="text-red-500">*</span></label>
                  <input name="city" type="text" required placeholder="e.g. Bloomfield Hills"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">State <span className="text-red-500">*</span></label>
                  <select name="state" required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                    <option value="">Select…</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Address</label>
                <input name="address" type="text" placeholder="e.g. 1700 17-Mile Drive"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">ZIP Code</label>
                  <input name="zip" type="text" placeholder="e.g. 48302"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone</label>
                  <input name="phone" type="tel" placeholder="e.g. (248) 555-0100"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Course Email</label>
                <input name="email" type="email" placeholder="e.g. pro@course.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Website</label>
                <input name="website" type="url" placeholder="e.g. https://www.course.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); setStatus(null) }}
                  className="flex-1 border border-gray-200 text-[#6B7770] rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
                  {loading ? 'Adding…' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
