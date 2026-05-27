'use client'

import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { RevenueByMonth, MrrHistory } from '@/lib/reports/financial'

export function RevenueStackedChart({ data }: { data: RevenueByMonth[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Legend />
        <Bar dataKey="membership" fill="#1B4332" name="Membership" stackId="a" />
        <Bar dataKey="outing" fill="#E0A800" name="Outing" stackId="a" />
        <Bar dataKey="affiliate" fill="#6B7770" name="Affiliate" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MrrAreaChart({ data }: { data: MrrHistory[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Legend />
        <Area dataKey="eagle" fill="#E0A800" stroke="#E0A800" fillOpacity={0.3} name="Eagle MRR" stackId="a" />
        <Area dataKey="ace" fill="#1B4332" stroke="#1B4332" fillOpacity={0.3} name="Ace MRR" stackId="a" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
