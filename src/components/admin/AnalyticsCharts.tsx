'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface MrrMonth { month: string; mrr: number }
interface TierCount { tier: string; count: number }
interface DailyCount { date: string; count: number }

interface AnalyticsChartsProps {
  mrrHistory: MrrMonth[]
  tierBreakdown: TierCount[]
  newMembersDaily: DailyCount[]
  bookingVolumeDaily: DailyCount[]
}

const TIER_COLORS: Record<string, string> = {
  ace: '#1B4332',
  eagle: '#E0A800',
  fairway: '#CBD5E1',
}

const CHART_STYLE = { fontSize: 11, fill: '#6B7770' }

export default function AnalyticsCharts({ mrrHistory, tierBreakdown, newMembersDaily, bookingVolumeDaily }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* MRR Growth */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">MRR Growth</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={mrrHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={CHART_STYLE} tickLine={false} axisLine={false} />
            <YAxis tick={CHART_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v}`, 'MRR']} />
            <Bar dataKey="mrr" fill="#1B4332" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tier Breakdown */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">Tier Breakdown</h3>
        {tierBreakdown.every(t => t.count === 0) ? (
          <p className="text-sm text-[#6B7770] mt-8 text-center">No active members yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tierBreakdown} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {tierBreakdown.map(entry => (
                  <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#94A3B8'} />
                ))}
              </Pie>
              <Legend formatter={(v: string) => <span className="capitalize text-xs">{v}</span>} />
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* New Members */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">New Members</h3>
        {newMembersDaily.length === 0 ? (
          <p className="text-sm text-[#6B7770] mt-8 text-center">No signups in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={newMembersDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={CHART_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={CHART_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1B4332" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Booking Volume */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">Booking Volume</h3>
        {bookingVolumeDaily.length === 0 ? (
          <p className="text-sm text-[#6B7770] mt-8 text-center">No bookings in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bookingVolumeDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={CHART_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={CHART_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#E0A800" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
