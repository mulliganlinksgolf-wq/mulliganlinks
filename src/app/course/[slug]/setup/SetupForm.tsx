'use client'

import { useState } from 'react'
import { activateCoursePartner } from './actions'

export default function SetupForm({ token, slug, email }: { token: string; slug: string; email: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await activateCoursePartner(new FormData(e.currentTarget), token, slug)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input value={email} disabled
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-[#6B7770]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
        <input name="password" type="password" required minLength={8} autoComplete="new-password"
          disabled={loading}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
        <p className="text-xs text-[#6B7770] mt-1">Minimum 8 characters</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Confirm Password</label>
        <input name="confirm" type="password" required autoComplete="new-password"
          disabled={loading}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
        {loading ? 'Activating…' : 'Activate Account'}
      </button>
    </form>
  )
}
