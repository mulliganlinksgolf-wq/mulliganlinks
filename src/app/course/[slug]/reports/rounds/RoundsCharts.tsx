'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CourseMetricRow } from '@/lib/reports/courseMetrics'

export function RoundsBarChart({ data }: { data: CourseMetricRow[] }) {
  const chartData = data.map(d => ({ month: d.month, rounds: d.rounds_booked }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="rounds" fill="#1B4332" name="Rounds Booked" />
      </BarChart>
    </ResponsiveContainer>
  )
}
