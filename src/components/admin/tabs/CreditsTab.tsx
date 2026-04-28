'use client'
import { useActionState } from 'react'
import { addCredit } from '@/app/admin/users/[userId]/actions'

interface Credit {
  id: string; type: string; amount_cents: number; status: string
  expires_at: string | null; created_at: string
}

export default function CreditsTab({ userId, credits }: { userId: string; credits: Credit[] }) {
  const [state, action, pending] = useActionState(addCredit, {})

  return (
    <div className="space-y-6">
      {credits.length === 0 ? <p className="text-sm text-[#6B7770]">No credits found.</p> : (
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-right px-4 py-2 font-medium">Amount</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {credits.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 capitalize">{c.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right font-medium">${(c.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-[#6B7770]">{c.status}</td>
                <td className="px-4 py-3 text-[#6B7770]">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="border-t border-black/5 pt-5">
        <h3 className="text-sm font-semibold mb-3">Add Credit</h3>
        <form action={action} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Type</label>
            <select name="type" className="rounded-lg border border-black/15 px-3 py-2 text-sm">
              <option value="monthly">Monthly</option>
              <option value="birthday">Birthday</option>
              <option value="free_round">Free Round</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Amount ($)</label>
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="10.00" className="w-28 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={pending} className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {pending ? 'Adding…' : 'Add Credit'}
          </button>
          {state.error && <p className="text-red-600 text-sm w-full">{state.error}</p>}
          {state.success && <p className="text-emerald-600 text-sm w-full">Credit added.</p>}
        </form>
      </div>
    </div>
  )
}
