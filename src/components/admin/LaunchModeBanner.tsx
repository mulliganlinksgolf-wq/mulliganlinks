interface LaunchModeBannerProps {
  isLive: boolean
}

export default function LaunchModeBanner({ isLive }: LaunchModeBannerProps) {
  if (isLive) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 mb-6">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <strong>Live Mode is ON</strong> — Members can book tee times and sign up for membership.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-6">
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 flex-shrink-0" />
      <div className="flex-1">
        <strong>Waitlist Mode is ON</strong> — The site is showing the coming-soon experience. Members cannot book tee times.
      </div>
      <a
        href="/admin/config"
        className="ml-auto flex-shrink-0 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
      >
        Go Live
      </a>
    </div>
  )
}
