'use client'

import { useState } from 'react'
import { inviteCoursePartner } from '@/app/admin/courses/inviteActions'

interface Course { id: string; name: string }

export default function InviteCoursePartner({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const result = await inviteCoursePartner(new FormData(e.currentTarget))
    setStatus(result)
    setLoading(false)
    if (result.success) setTimeout(() => { setOpen(false); setStatus(null) }, 2000)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829]">
        Invite Course Partner
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1A1A1A]">Invite Course Partner</h2>
              <button onClick={() => setOpen(false)} className="text-[#6B7770] hover:text-[#1A1A1A] text-xl leading-none">×</button>
            </div>

            {status?.success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 mb-4">
                Invite sent successfully.
              </div>
            )}
            {status?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">{status.error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Course</label>
                <select name="course_id" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                  <option value="">Select course…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Contact Name</label>
                <input name="name" type="text" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
                <input name="email" type="email" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Role</label>
                <select name="role" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                  <option value="owner">Owner</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-200 text-[#6B7770] rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
                  {loading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
