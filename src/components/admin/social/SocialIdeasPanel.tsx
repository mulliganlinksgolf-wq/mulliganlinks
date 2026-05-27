'use client'

import { useState, useTransition } from 'react'
import type { BufferPost } from '@/lib/buffer'
import { saveIdea } from '@/app/admin/social/actions'

type Props = {
  sentPosts: BufferPost[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white',
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-black text-white',
}

export default function SocialIdeasPanel({ sentPosts }: Props) {
  const [ideaText, setIdeaText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleSaveIdea() {
    if (!ideaText.trim()) return
    const fd = new FormData()
    fd.append('title', ideaText.slice(0, 80))
    fd.append('text', ideaText)
    startTransition(async () => {
      const result = await saveIdea(fd)
      if (result.success) {
        setIdeaText('')
        showToast('Idea saved ✓')
      } else {
        showToast(result.error ?? 'Failed to save idea')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1B4332] text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Ideas bank */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
        <div>
          <h2 className="font-bold text-[#1A1A1A]">Content Ideas</h2>
          <p className="text-xs text-[#6B7770] mt-0.5">
            Save content ideas to your Buffer backlog. Assign to a channel when you're ready to post.
          </p>
        </div>
        <textarea
          rows={3}
          value={ideaText}
          onChange={e => setIdeaText(e.target.value)}
          placeholder="Drop an idea here — topic, angle, anything..."
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
        <button
          onClick={handleSaveIdea}
          disabled={isPending || !ideaText.trim()}
          className="rounded-lg border border-[#1B4332] px-4 py-1.5 text-xs font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Idea'}
        </button>
      </div>

      {/* Recently sent */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
        <h2 className="font-bold text-[#1A1A1A]">Recently Sent</h2>
        {sentPosts.length === 0 && (
          <p className="text-sm text-[#6B7770]">No recent posts yet.</p>
        )}
        <div className="space-y-3">
          {sentPosts.map(post => (
            <div key={post.id} className="rounded-lg border border-black/8 bg-[#FAF7F2]/60 p-3 space-y-1.5 opacity-75">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    PLATFORM_COLORS[post.channelId] ?? 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {post.channelId}
                </span>
                <span className="text-xs text-[#6B7770] ml-auto">
                  Sent {relativeTime(post.dueAt)}
                </span>
              </div>
              <p className="text-sm text-[#6B7770] line-clamp-2">{post.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
