'use client'
import React, { useActionState, useTransition } from 'react'
import { markDisputeWon, markDisputeLost, addDisputeNote } from '@/app/admin/disputes/actions'

export interface DisputeRow {
  id: string
  stripe_dispute_id: string
  amount_cents: number
  reason: string | null
  status: string
  evidence_due_by: string | null
  created_at: string
  resolved_at: string | null
  member_name: string | null
  member_email: string | null
  timeline: { event_type: string; created_at: string; details: any }[]
}

interface DisputeDetailPanelProps {
  dispute: DisputeRow
  onClose: () => void
}

export default function DisputeDetailPanel({ dispute, onClose }: DisputeDetailPanelProps) {
  const [noteState, noteAction, notePending] = useActionState(addDisputeNote, {})
  const [pending, startTransition] = useTransition()

  function handleWon() {
    startTransition(async () => {
      await markDisputeWon(dispute.id, dispute.stripe_dispute_id)
      onClose()
    })
  }

  function handleLost() {
    startTransition(async () => {
      await markDisputeLost(dispute.id, dispute.stripe_dispute_id)
      onClose()
    })
  }

  const isResolved = dispute.status === 'won' || dispute.status === 'lost'

  return (
    <div className="border border-black/8 rounded-xl p-5 bg-[#FAF7F2] space-y-5">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-[#1A1A1A]">Dispute Details</h3>
        <button onClick={onClose} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">✕ Close</button>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        {[
          { label: 'Stripe Dispute ID', value: dispute.stripe_dispute_id },
          { label: 'Amount', value: `$${(dispute.amount_cents / 100).toFixed(2)}` },
          { label: 'Reason', value: dispute.reason ?? '—' },
          { label: 'Status', value: <span className="capitalize">{dispute.status}</span> },
          { label: 'Opened', value: new Date(dispute.created_at).toLocaleDateString() },
          { label: 'Evidence Due', value: dispute.evidence_due_by ? new Date(dispute.evidence_due_by).toLocaleDateString() : '—' },
          { label: 'Member', value: dispute.member_name ?? dispute.member_email ?? '—' },
        ].map(({ label, value }) => (
          <React.Fragment key={label}>
            <dt className="text-[#6B7770]">{label}</dt>
            <dd className="font-medium text-[#1A1A1A]">{value}</dd>
          </React.Fragment>
        ))}
      </dl>

      {dispute.timeline.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#6B7770] mb-2">Timeline</h4>
          <div className="space-y-2">
            {dispute.timeline.map((e, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-[#6B7770]">{new Date(e.created_at).toLocaleDateString()}</span>
                <span className="text-[#1A1A1A] capitalize">{e.event_type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-black/8">
        <a
          href={`https://dashboard.stripe.com/disputes/${dispute.stripe_dispute_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#FAF7F2] transition-colors"
        >
          Open in Stripe ↗
        </a>
        {!isResolved && (
          <>
            <button
              onClick={handleWon}
              disabled={pending}
              className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Mark Won
            </button>
            <button
              onClick={handleLost}
              disabled={pending}
              className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Mark Lost
            </button>
          </>
        )}
      </div>

      {!isResolved && (
        <form action={noteAction} className="space-y-2">
          <input type="hidden" name="disputeId" value={dispute.id} />
          <input type="hidden" name="stripeDisputeId" value={dispute.stripe_dispute_id} />
          <textarea
            name="note"
            placeholder="Add a note…"
            rows={2}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none bg-white"
          />
          {noteState.error && <p className="text-red-600 text-xs">{noteState.error}</p>}
          {noteState.success && <p className="text-emerald-600 text-xs">Note saved.</p>}
          <button type="submit" disabled={notePending} className="rounded-lg bg-[#1B4332] text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50">
            {notePending ? 'Saving…' : 'Save Note'}
          </button>
        </form>
      )}
    </div>
  )
}
