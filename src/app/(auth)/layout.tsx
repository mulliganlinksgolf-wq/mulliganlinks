export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-[#1B4332] font-bold text-2xl tracking-wide lowercase">
            mulliganlinks
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
