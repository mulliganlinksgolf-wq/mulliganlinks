export function StatBlock({ stat, label }: { stat: string; label: string }) {
  return (
    <div className="my-6 bg-[#0F3D2E] rounded-xl p-6 text-center">
      <div className="text-4xl font-black text-[#E0A800] mb-2">{stat}</div>
      <div className="text-sm text-[#F4F1EA]/80">{label}</div>
    </div>
  )
}
