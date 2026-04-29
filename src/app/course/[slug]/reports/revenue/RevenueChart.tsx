'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CourseMetricRow } from '@/lib/reports/courseMetrics'

export function RevenueLineChart({ data }: { data: CourseMetricRow[] }) {
  const chartData = data.map(d => ({ month: d.month, revenue: Number(d.green_fee_revenue) }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
        <Line dataKey="revenue" stroke="#1B4332" strokeWidth={2} dot={false} name="Revenue" />
      </LineChart>
    </ResponsiveContainer>
  )
}
