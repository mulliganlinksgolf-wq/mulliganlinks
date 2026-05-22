import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { SiteFooter } from '@/components/SiteFooter'
import { FadeIn } from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Golf Course Software Tips & Tee Time Guides',
  description: 'Tee sheet software comparisons, GolfNow alternative guides, and Metro Detroit golf resources — for course operators and local golfers.',
  alternates: { canonical: 'https://www.teeahead.com/blog' },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <header className="bg-white border-b border-[#0F3D2E]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-12 w-auto" /></Link>
          <Link
            href="/waitlist/course"
            className="rounded-md bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors"
          >
            Claim a spot →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        <FadeIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-px bg-[#E0A800]" />
            <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
              The TeeAhead reading room
            </span>
          </div>
          <h1
            className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-[1.05] max-w-3xl"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}
          >
            Notes on tee sheets, barter math, and the{' '}
            <em className="italic text-[#E0A800]">local-first</em> case for leaving GolfNow.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#1A1A1A]/78 leading-relaxed max-w-2xl">
            Tee sheet software comparisons, GolfNow alternative guides, and Metro Detroit golf resources — written for course operators and the golfers who play their courses.
          </p>
        </FadeIn>

        <div className="mt-14">
          {posts.length === 0 ? (
            <p className="text-center text-[#6B7770]">Posts coming soon.</p>
          ) : (
            <CategoryFilter posts={posts} />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
