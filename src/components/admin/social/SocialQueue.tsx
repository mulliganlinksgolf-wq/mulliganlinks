'use client'

import { useState, useTransition } from 'react'
import type { BufferPost } from '@/lib/buffer'
import { deleteScheduledPost } from '@/app/admin/social/actions'

type Props = {
  scheduledPosts: BufferPost[]
  onFillSaturdaySlot: () => void
  onToast?: (msg: string) => void
}

function getNextSaturdayRange(): { start: Date; end: Date } {
  const now = new Date()
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  sat.setHours(0, 0, 0, 0)
  const start = new Date(sat)
  start.setHours(7, 0, 0, 0)
  const end = new Date(sat)
  end.setHours(9, 0, 0, 0)
  // Convert to UTC (EST = UTC-5)
  return {
    start: new Date(start.getTime() + 5 * 60 * 60 * 1000),
    end: new Date(end.getTime() + 5 * 60 * 60 * 1000),
  }
}

function hasSaturdayPost(posts: BufferPost[]): boolean {
  const { start, end } = getNextSaturdayRange()
  return posts.some(p => {
    const due = new Date(p.dueAt)
    return due >= start && due <= end
  })
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white',
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-black text-white',
}

function formatDueAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
}

export default function SocialQueue({ scheduledPosts, onFillSaturdaySlot, onToast }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startDelete] = useTransition()
  const sorted = [...scheduledPosts].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  )
  const missingSaturdaySlot = !hasSaturdayPost(scheduledPosts)

  function handleDelete(postId: string) {
    if (!confirm('Delete this scheduled post? This cannot be undone.')) return
    setDeletingId(postId)
    startDelete(async () => {
      const result = await deleteScheduledPost(postId)
      setDeletingId(null)
      if (result.success) {
        onToast?.('Post deleted ✓')
      } else {
        onToast?.(`Delete failed: ${result.error ?? 'Unknown error'}`)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
      <h2 className="font-bold text-[#1A1A1A]">
        Scheduled ({scheduledPosts.length})
      </h2>

      {missingSaturdaySlot && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start justify-between gap-3">
          <p className="text-sm text-amber-800">
            ⚠️ No post scheduled for Saturday 8am — your highest-value slot is empty.
          </p>
          <button
            onClick={onFillSaturdaySlot}
            className="text-xs font-semibold text-amber-900 hover:underline whitespace-nowrap"
          >
            Fill this slot →
          </button>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-[#6B7770]">No posts scheduled.</p>
          <p className="text-xs text-[#6B7770] mt-1">Use the composer to add to your queue.</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(post => (
          <div key={post.id} className="rounded-lg border border-black/8 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  PLATFORM_COLORS[post.channelId] ?? 'bg-gray-200 text-gray-800'
                }`}
              >
                {post.channelId}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
                  post.status === 'scheduled'
                    ? 'bg-emerald-100 text-emerald-800'
                    : post.status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {post.status}
              </span>
            </div>
            <p className="text-sm text-[#1A1A1A] line-clamp-2">{post.text}</p>
            {post.assets?.[0]?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.assets[0].url}
                alt=""
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6B7770]">{formatDueAt(post.dueAt)}</p>
              <button
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
                className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
              >
                {deletingId === post.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
