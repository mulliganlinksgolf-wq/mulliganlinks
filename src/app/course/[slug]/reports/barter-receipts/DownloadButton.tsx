'use client'

import { useState, useTransition } from 'react'
import { getReceiptDownloadUrl } from './actions'

export function DownloadButton({ slug, receiptId }: { slug: string; receiptId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await getReceiptDownloadUrl({ slug, receiptId })
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      } else {
        setError(result.error ?? 'failed')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-[#1B4332] underline text-xs hover:text-[#163829] disabled:opacity-60"
      >
        {isPending ? '…' : 'Download'}
      </button>
      {error && <span className="text-[10px] text-red-600 ml-2">{error}</span>}
    </>
  )
}
