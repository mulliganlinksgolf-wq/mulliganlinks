'use client'

import { useState, useTransition } from 'react'
import { triggerImapSync } from '@/app/actions/crm/imap'

export function SyncButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)

  function handleClick() {
    setResult(null)
    setErrors([])
    setShowErrors(false)
    startTransition(async () => {
      try {
        const r = await triggerImapSync()
        const errMsg = r.errors.length ? ` · ${r.errors.length} error(s)` : ''
        setResult(`Logged ${r.totalLogged} · Skipped ${r.totalSkipped}${errMsg}`)
        setErrors(r.errors)
      } catch (err) {
        setResult(`Error: ${(err as Error).message}`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <button
          onClick={handleClick}
          disabled={pending}
          className="text-sm px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#1B4332]/90 disabled:opacity-50"
        >
          {pending ? 'Syncing…' : 'Sync emails now'}
        </button>
        {result && <span className="text-xs text-slate-600">{result}</span>}
        {errors.length > 0 && (
          <button
            type="button"
            onClick={() => setShowErrors(s => !s)}
            className="text-xs text-red-600 underline"
          >
            {showErrors ? 'Hide' : 'Show'} details
          </button>
        )}
      </div>
      {showErrors && errors.length > 0 && (
        <ul className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 space-y-1 font-mono max-w-2xl">
          {errors.map((e, i) => <li key={i} className="break-all">• {e}</li>)}
        </ul>
      )}
    </div>
  )
}
