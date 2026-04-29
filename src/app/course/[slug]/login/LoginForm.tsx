'use client'

import { useState } from 'react'
import { loginCoursePartner } from './actions'

export default function LoginForm({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await loginCoursePartner(new FormData(e.currentTarget), slug)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input name="email" type="email" required autoComplete="email"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
        <input name="password" type="password" required autoComplete="current-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
