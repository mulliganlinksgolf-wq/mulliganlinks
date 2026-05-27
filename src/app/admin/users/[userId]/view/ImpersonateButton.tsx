'use client'

import { useState } from 'react'

export default function ImpersonateButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/impersonate?userId=${userId}`)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      window.open(json.url, '_blank')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1B4332] text-white hover:bg-[#163d2a] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating link…' : '🔐 Open real member experience →'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
