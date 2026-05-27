'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CourseMetricRow } from '@/lib/reports/courseMetrics'

export function WaitlistBarChart({ data }: { data: CourseMetricRow[] }) {
  const chartData = data.slice(-6).map(d => ({ month: d.month, fills: d.waitlist_fills }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="fills" fill="#1B4332" name="Waitlist Fills" />
      </BarChart>
    </ResponsiveContainer>
  )
}
