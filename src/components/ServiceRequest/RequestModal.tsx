'use client'

import { useState } from 'react'
import { SERVICE_REQUEST_CATEGORIES, type ServiceRequestCategory } from '@/lib/serviceRequestCategories'

interface RequestModalProps {
  courseId: string
  bookingId: string | null
  onClose: () => void
  onSubmitted: () => void
}

export function RequestModal({ courseId, bookingId, onClose, onSubmitted }: RequestModalProps) {
  const [selected, setSelected] = useState<ServiceRequestCategory | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          booking_id: bookingId,
          category: selected,
          note: note.trim(),
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      onSubmitted()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold font-sans text-gray-900">What do you need?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Category grid */}
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          {SERVICE_REQUEST_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelected(cat.value)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-2 border-2 transition-all text-center ${
                selected === cat.value
                  ? 'border-[#1B4332] bg-[#f0faf4]'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              }`}
            >
              <span className="text-2xl leading-none">{cat.icon}</span>
              <span className="text-[11px] font-medium font-sans text-gray-700 leading-tight">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Notes textarea — visible after selection */}
        {selected && (
          <div className="px-4 pb-3">
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-sans text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
              rows={3}
              maxLength={200}
              placeholder="Any details? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 font-sans text-right mt-0.5">
              {note.length}/200
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="px-4 pb-2 text-xs text-red-500 font-sans">
            Couldn't send — try again
          </p>
        )}

        {/* Submit */}
        <div className="px-4 pb-5">
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="w-full py-3 rounded-xl text-white font-semibold font-sans text-sm transition-opacity disabled:opacity-40"
            style={{ background: '#1B4332' }}
          >
            {loading ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}
