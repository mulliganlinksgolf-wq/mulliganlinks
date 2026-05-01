'use client'

import { useState, useTransition } from 'react'
import { inviteStaff } from '@/lib/actions/courseTeam'

export default function InviteStaffModal({
  courseId,
  slug,
}: {
  courseId: string
  slug: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await inviteStaff(email, courseId, slug)
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setEmail('')
          setSuccess(false)
        }, 2000)
      } catch (err: any) {
        setError(err.message ?? 'Failed to send invite')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-medium hover:bg-[#163d2a] transition-colors"
      >
        + Invite staff member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Invite staff member</h2>
            <p className="text-sm text-[#6B7770] mb-4">
              They&apos;ll receive an email to set up their account and will have access to the tee sheet, check-in, bookings, and members pages.
            </p>

            {success ? (
              <p className="text-sm text-emerald-700 font-medium">✓ Invite sent to {email}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="staff@thecourse.com"
                    className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setEmail(''); setError(null) }}
                    className="px-4 py-2 text-sm text-[#6B7770] hover:text-[#1A1A1A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-medium hover:bg-[#163d2a] disabled:opacity-50 transition-colors"
                  >
                    {pending ? 'Sending…' : 'Send invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
