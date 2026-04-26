export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-[#1B4332]/20 border-t-[#1B4332] animate-spin" />
        <p className="text-sm text-[#6B7770]">Loading…</p>
      </div>
    </div>
  )
}
