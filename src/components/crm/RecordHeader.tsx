import Link from 'next/link'

interface Props {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  badge?: { label: string; color: 'green' | 'amber' | 'slate' | 'red' | 'blue' }
}

const badgeColors = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-700',
}

export function RecordHeader({ backHref, backLabel, title, subtitle, badge }: Props) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <Link href={backHref} className="text-sm text-slate-400 hover:text-slate-600 mb-1 block">
          ← {backLabel}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {badge && (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${badgeColors[badge.color]}`}>
          {badge.label}
        </span>
      )}
    </div>
  )
}
