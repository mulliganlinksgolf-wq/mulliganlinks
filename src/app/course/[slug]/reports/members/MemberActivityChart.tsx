'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CourseMetricRow } from '@/lib/reports/courseMetrics'

export function PointsBarChart({ data }: { data: CourseMetricRow[] }) {
  const chartData = data.map(d => ({
    month: d.month,
    earned: d.points_earned,
    redeemed: d.points_redeemed,
  }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="earned" fill="#1B4332" name="Points Earned" />
        <Bar dataKey="redeemed" fill="#E0A800" name="Points Redeemed" />
      </BarChart>
    </ResponsiveContainer>
  )
}
