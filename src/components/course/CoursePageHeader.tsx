import type { ReactNode } from 'react'

export function CoursePageHeader({
  title, subtitle, action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const dayLabel = new Date()
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()

  return (
    <header className="bg-white border-b border-[#0F3D2E]/10 px-7 py-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1
          className="font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-[#0F3D2E] truncate"
          style={{ fontWeight: 400 }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#6B7770] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0F3D2E]/[0.06] text-[#0F3D2E] font-mono text-xs">
          <span className="size-1.5 rounded-full bg-[#3FB87B]" />
          LIVE · {dayLabel}
        </div>
        {action}
      </div>
    </header>
  )
}
