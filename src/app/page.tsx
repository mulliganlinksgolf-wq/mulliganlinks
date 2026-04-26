import { WaitlistForm } from '@/components/WaitlistForm'

export const metadata = {
  title: 'MulliganLinks — Your home course, redone right.',
  description: 'The local-first golf membership network. Escape booking fees and get more for your golf dollar.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-[#1B4332] font-bold text-xl tracking-wide lowercase">
          mulliganlinks
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Badge */}
          <span className="inline-block bg-[#E0A800]/15 text-[#1B4332] text-sm font-medium px-4 py-1.5 rounded-full border border-[#E0A800]/30">
            Coming soon · Local-first golf membership
          </span>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] leading-tight tracking-tight">
            Your home course,
            <br />
            <span className="text-[#1B4332]">redone right.</span>
          </h1>

          {/* Subhead */}
          <p className="text-xl text-[#6B7770] leading-relaxed max-w-xl mx-auto">
            MulliganLinks is the golf membership network built for local players
            and the courses they love — no barter traps, no booking fees, just
            better golf.
          </p>

          {/* Waitlist */}
          <div className="pt-4 flex flex-col items-center gap-2 relative">
            <WaitlistForm />
            <p className="text-sm text-[#6B7770] mt-4">
              Be first when we launch in your area.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-sm text-[#6B7770]">© 2026 MulliganLinks</p>
      </footer>
    </div>
  )
}
