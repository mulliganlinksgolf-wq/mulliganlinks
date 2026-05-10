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
  months: { month: string; passesRedeemed: number }[]
}

export function GuestChart({ months }: Props) {
  if (months.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={months} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          label={{ value: 'Redemptions', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12 } }}
        />
        <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Redemptions']} />
        <Bar dataKey="passesRedeemed" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
