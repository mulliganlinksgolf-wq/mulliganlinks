'use client'

import { useState, useTransition } from 'react'
import type { BufferChannel, BufferPost } from '@/lib/buffer'
import { deleteScheduledPost, updateScheduledPost } from '@/app/admin/social/actions'

type Props = {
  channels: BufferChannel[]
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

const PLATFORM_BADGES: Record<string, string> = {
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

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SocialQueue({ channels, scheduledPosts, onFillSaturdaySlot, onToast }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<BufferPost | null>(null)
  const [editText, setEditText] = useState('')
  const [editDueAt, setEditDueAt] = useState('')
  const [, startMutation] = useTransition()

  const channelMap = Object.fromEntries(channels.map(c => [c.id, c]))

  const sorted = [...scheduledPosts].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  )
  const missingSaturdaySlot = !hasSaturdayPost(scheduledPosts)

  function handleDelete(postId: string) {
    if (!confirm('Delete this scheduled post? This cannot be undone.')) return
    setDeletingId(postId)
    startMutation(async () => {
      const result = await deleteScheduledPost(postId)
      setDeletingId(null)
      onToast?.(result.success ? 'Post deleted ✓' : `Delete failed: ${result.error ?? 'Unknown error'}`)
    })
  }

  function openEdit(post: BufferPost) {
    setEditingPost(post)
    setEditText(post.text)
    setEditDueAt(toLocalDatetimeValue(post.dueAt))
  }

  function handleEditSave() {
    if (!editingPost) return
    const channel = channelMap[editingPost.channelId]
    if (!channel) {
      onToast?.('Could not find channel info for this post')
      return
    }
    const fd = new FormData()
    fd.append('postId', editingPost.id)
    fd.append('text', editText)
    fd.append('service', channel.service)
    fd.append('mode', 'customScheduled')
    fd.append('dueAt', new Date(editDueAt).toISOString())

    startMutation(async () => {
      const result = await updateScheduledPost(fd)
      if (result.success) {
        setEditingPost(null)
        onToast?.('Post updated ✓')
      } else {
        onToast?.(`Update failed: ${result.error ?? 'Unknown error'}`)
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
        {sorted.map(post => {
          const channel = channelMap[post.channelId]
          const service = channel?.service
          return (
            <div key={post.id} className="rounded-lg border border-black/8 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    service ? PLATFORM_BADGES[service] : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {service ?? post.channelId}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(post)}
                    className="text-xs text-[#1B4332] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                  >
                    {deletingId === post.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editingPost && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingPost(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-[#1A1A1A]">Edit scheduled post</h3>
            <div>
              <label className="text-xs font-medium text-[#6B7770] block mb-1">Caption</label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770] block mb-1">Scheduled time</label>
              <input
                type="datetime-local"
                value={editDueAt}
                onChange={e => setEditDueAt(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPost(null)}
                className="text-sm text-[#6B7770] hover:text-[#1A1A1A] px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="text-sm bg-[#1B4332] text-white px-4 py-1.5 rounded-lg hover:bg-[#1B4332]/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
