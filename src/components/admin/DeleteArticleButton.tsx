'use client'

import { useTransition } from 'react'
import { deleteKbArticle } from '@/app/actions/knowledgeBase'

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this article? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteKbArticle({}, articleId)
      if (result?.error) {
        alert(`Delete failed: ${result.error}`)
        return
      }
      window.location.reload()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-red-500 hover:underline text-sm disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
