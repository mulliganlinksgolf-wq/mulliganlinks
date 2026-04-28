'use client'
import { useActionState } from 'react'
import { adjustPoints } from '@/app/admin/users/[userId]/actions'

interface Point {
  id: string; amount: number; reason: string | null; created_at: string; course_name: string | null
}

export default function PointsTab({ userId, points }: { userId: string; points: Point[] }) {
  const [state, action, pending] = useActionState(adjustPoints, {})
  const total = points.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-[#1B4332]">{total.toLocaleString()}</span>
        <span className="text-sm text-[#6B7770]">total Fairway Points</span>
      </div>
      {points.length === 0 ? <p className="text-sm text-[#6B7770]">No points history.</p> : (
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-left px-4 py-2 font-medium">Reason</th>
              <th className="text-right px-4 py-2 font-medium">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {points.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-[#6B7770]">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{p.reason ?? '—'}</td>
                <td className={`px-4 py-3 text-right font-semibold ${p.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {p.amount >= 0 ? '+' : ''}{p.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="border-t border-black/5 pt-5">
        <h3 className="text-sm font-semibold mb-3">Adjust Points</h3>
        <form action={action} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Amount (use − for deduction)</label>
            <input name="amount" type="number" placeholder="e.g. 500 or -100" className="w-36 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Reason</label>
            <input name="reason" type="text" placeholder="Courtesy adjustment" className="w-56 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={pending} className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {pending ? 'Saving…' : 'Apply Adjustment'}
          </button>
          {state.error && <p className="text-red-600 text-sm w-full">{state.error}</p>}
          {state.success && <p className="text-emerald-600 text-sm w-full">Points adjusted.</p>}
        </form>
      </div>
    </div>
  )
}
