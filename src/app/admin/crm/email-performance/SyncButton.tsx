'use client'

import { useState, useTransition } from 'react'
import { triggerImapSync } from '@/app/actions/crm/imap'

export function SyncButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      try {
        const r = await triggerImapSync()
        const errMsg = r.errors.length ? ` · ${r.errors.length} error(s)` : ''
        setResult(`Logged ${r.totalLogged} · Skipped ${r.totalSkipped}${errMsg}`)
      } catch (err) {
        setResult(`Error: ${(err as Error).message}`)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={pending}
        className="text-sm px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#1B4332]/90 disabled:opacity-50"
      >
        {pending ? 'Syncing…' : 'Sync emails now'}
      </button>
      {result && <span className="text-xs text-slate-600">{result}</span>}
    </div>
  )
}
