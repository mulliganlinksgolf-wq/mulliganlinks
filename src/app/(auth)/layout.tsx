import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <a href="/">
            <Image src="/logo.png" alt="MulliganLinks" width={566} height={496} className="h-32 w-auto" priority />
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
