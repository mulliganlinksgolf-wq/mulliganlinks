import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
