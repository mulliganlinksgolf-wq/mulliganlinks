export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 border-l-4 border-[#E0A800] bg-[#FFF8E6] px-5 py-4 rounded-r-lg text-sm text-[#0F3D2E] font-medium leading-relaxed">
      {children}
    </div>
  )
}
