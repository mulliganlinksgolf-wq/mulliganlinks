'use client'

import { useActionState, useState } from 'react'
import { createMember } from '@/app/actions/admin'

const initial = { error: undefined, success: undefined }

export function CreateMemberModal() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createMember, initial)

  // Close on success after brief delay
  if (state.success && open) {
    setTimeout(() => { setOpen(false) }, 800)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Create new member</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#6B7770] hover:text-[#1A1A1A] p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={action} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">Full name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">Membership tier</label>
                  <select
                    name="tier"
                    defaultValue="fairway"
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  >
                    <option value="fairway">Fairway (free)</option>
                    <option value="eagle">Eagle</option>
                    <option value="ace">Ace</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    id="is_admin"
                    name="is_admin"
                    type="checkbox"
                    value="true"
                    className="w-4 h-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]/30"
                  />
                  <label htmlFor="is_admin" className="text-sm font-medium text-[#1A1A1A]">
                    Grant admin access
                  </label>
                </div>
              </div>

              {state.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
              )}
              {state.success && (
                <p className="text-sm text-[#1B4332] bg-[#1B4332]/10 rounded-lg px-3 py-2">Member created ✓</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-black/15 py-2.5 text-sm font-medium text-[#6B7770] hover:bg-[#FAF7F2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#1B4332] py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors disabled:opacity-60"
                >
                  {pending ? 'Creating…' : 'Create member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
