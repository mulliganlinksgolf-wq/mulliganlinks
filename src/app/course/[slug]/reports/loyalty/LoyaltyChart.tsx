'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  buckets: { label: string; count: number }[]
}

export function LoyaltyChart({ buckets }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={buckets} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          label={{ value: 'Members', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12 } }}
        />
        <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Members']} />
        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
