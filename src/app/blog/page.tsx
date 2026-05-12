import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'Golf Course Software Tips & Tee Time Guides',
  description: 'Tee sheet software comparisons, GolfNow alternative guides, and Metro Detroit golf resources — for course operators and local golfers.',
  alternates: { canonical: 'https://www.teeahead.com/blog' },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-14 w-auto" /></Link>
          <nav className="flex items-center gap-3">
            <Link href="/waitlist/course" className="hidden sm:inline-flex items-center justify-center rounded-lg border border-[#0F3D2E]/30 px-4 py-2 text-sm font-semibold text-[#0F3D2E] hover:border-[#0F3D2E] transition-colors">
              I Run a Course
            </Link>
            <Link href="/waitlist/golfer" className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-4 py-2 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity">
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#0F3D2E] mb-3">Golf Course Software Tips &amp; Tee Time Guides</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tee sheet software comparisons, GolfNow alternatives, and Metro Detroit golf resources — for course operators and local golfers.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-gray-400">Posts coming soon.</p>
        ) : (
          <CategoryFilter posts={posts} />
        )}
      </main>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-gray-400">
        <p>© 2026 TeeAhead, LLC · <Link href="/terms" className="hover:text-gray-600">Terms</Link> · <Link href="/privacy" className="hover:text-gray-600">Privacy</Link></p>
      </footer>
    </div>
  )
}
