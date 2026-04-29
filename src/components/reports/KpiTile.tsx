interface KpiTileProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  alert?: boolean
}

export default function KpiTile({ label, value, sub, accent, alert }: KpiTileProps) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${alert ? 'border-red-300 bg-red-50' : accent ? 'border-[#1B4332]' : 'border-gray-200'}`}>
      <p className="text-xs text-[#6B7770] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-[#1A1A1A]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#6B7770] mt-1">{sub}</p>}
    </div>
  )
}
