'use client'

import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MemberGrowthRow } from '@/lib/reports/members'

export function GrowthLineChart({ data }: { data: MemberGrowthRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line dataKey="totalActive" stroke="#1B4332" name="Total Active" strokeWidth={2} dot={false} />
        <Line dataKey="newEagle" stroke="#E0A800" name="New Eagle" strokeWidth={1} dot={false} />
        <Line dataKey="newAce" stroke="#6B7770" name="New Ace" strokeWidth={1} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ChurnLineChart({ data }: { data: { month: string; churnPct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${v}%`, 'Churn Rate']} />
        <Line dataKey="churnPct" stroke="#EF4444" strokeWidth={2} dot={false} name="Churn %" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TierDonut({ eagle, ace, free }: { eagle: number; ace: number; free: number }) {
  const pieData = [
    { name: 'Ace', value: ace, color: '#1B4332' },
    { name: 'Eagle', value: eagle, color: '#E0A800' },
    { name: 'Free', value: free, color: '#E5E7EB' },
  ]
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
          label={({ name, percent }) => `${name} ${(Math.round((percent || 0) * 100))}%`}>
          {pieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
