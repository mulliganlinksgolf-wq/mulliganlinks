interface Booking {
  id: string; scheduled_at: string | null; created_at: string; players: number
  green_fee_cents: number | null; platform_fee_cents: number | null
  status: string; paid_at: string | null; course_name: string | null
}

export default function BookingsTab({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) return <p className="text-sm text-[#6B7770]">No bookings found.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Course</th>
            <th className="text-left px-4 py-2 font-medium">Date/Time</th>
            <th className="text-right px-4 py-2 font-medium">Players</th>
            <th className="text-right px-4 py-2 font-medium">Green Fee</th>
            <th className="text-right px-4 py-2 font-medium">Platform Fee</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {bookings.map(b => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-medium">{b.course_name ?? '—'}</td>
              <td className="px-4 py-3 text-[#6B7770]">
                {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
              </td>
              <td className="px-4 py-3 text-right">{b.players}</td>
              <td className="px-4 py-3 text-right">{b.green_fee_cents != null ? `$${(b.green_fee_cents / 100).toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3 text-right">{b.platform_fee_cents != null ? `$${(b.platform_fee_cents / 100).toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3 capitalize text-[#6B7770]">{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
