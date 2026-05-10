'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { voteKbArticle } from '@/app/actions/knowledgeBase'

export function KbHelpfulWidget({ articleId }: { articleId: string }) {
  const storageKey = `kb_voted_${articleId}`
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    setVoted(!!localStorage.getItem(storageKey))
  }, [storageKey])

  async function handleVote(vote: 'yes' | 'no') {
    if (voted) return
    try {
      await voteKbArticle(articleId, vote)
    } catch {
      // best-effort — don't block UI if vote fails
    }
    localStorage.setItem(storageKey, vote)
    setVoted(true)
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-6">
      <p className="text-sm font-medium text-[#1A1A1A] mb-3">Was this article helpful?</p>
      {voted ? (
        <p className="text-sm text-[#6B7770]">Thanks for your feedback!</p>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handleVote('yes')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </button>
          <button
            onClick={() => handleVote('no')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-[#6B7770] hover:border-red-400 hover:text-red-500 transition-colors"
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </button>
        </div>
      )}
    </div>
  )
}
