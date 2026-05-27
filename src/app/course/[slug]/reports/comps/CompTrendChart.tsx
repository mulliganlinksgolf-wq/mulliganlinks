'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  monthly: { month: string; redeemed: number }[]
}

export function CompTrendChart({ monthly }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="redeemed"
          name="Comps Redeemed"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
