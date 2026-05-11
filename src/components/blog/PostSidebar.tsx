import Link from 'next/link'
import type { PostMeta, Category } from '@/lib/blog'

function CoursesCTA() {
  return (
    <div className="bg-[#0F3D2E] rounded-xl p-5 text-[#F4F1EA]">
      <p className="text-xs font-bold text-[#E0A800] uppercase tracking-wide mb-2">Free Tool</p>
      <p className="text-sm font-bold mb-4">Calculate exactly what GolfNow costs your course every year</p>
      <Link
        href="/barter"
        className="block text-center bg-[#E0A800] text-[#0a0a0a] font-bold text-sm py-2.5 rounded-lg hover:bg-[#E0A800]/90 transition-colors mb-3"
      >
        Get my number →
      </Link>
      <Link
        href="/waitlist/course"
        className="block text-center border border-[#F4F1EA]/30 text-[#F4F1EA]/80 font-semibold text-sm py-2.5 rounded-lg hover:border-[#F4F1EA]/60 transition-colors"
      >
        Claim a Founding Spot
      </Link>
    </div>
  )
}

function GolfersCTA() {
  return (
    <div className="bg-[#0F3D2E] rounded-xl p-5 text-[#F4F1EA]">
      <p className="text-xs font-bold text-[#E0A800] uppercase tracking-wide mb-2">TeeAhead Membership</p>
      <p className="text-sm font-bold mb-1">Eagle — $89/yr</p>
      <p className="text-xs text-[#F4F1EA]/70 mb-4">Beats GolfPass+ on price and every benefit. Zero booking fees, 1 guest pass, priority access.</p>
      <Link
        href="/waitlist/golfer"
        className="block text-center bg-[#E0A800] text-[#0a0a0a] font-bold text-sm py-2.5 rounded-lg hover:bg-[#E0A800]/90 transition-colors"
      >
        Join the Waitlist
      </Link>
    </div>
  )
}

function CaseStudyCTA() {
  return (
    <div className="bg-[#0F3D2E] rounded-xl p-5 text-[#F4F1EA]">
      <p className="text-xs font-bold text-[#E0A800] uppercase tracking-wide mb-2">See It In Action</p>
      <p className="text-sm font-bold mb-1">Windsor Parke grew online revenue 382%</p>
      <p className="text-xs text-[#F4F1EA]/70 mb-4">$81,000 → $393,000 after leaving GolfNow.</p>
      <Link
        href="/case-studies/windsor-parke"
        className="block text-center bg-[#E0A800] text-[#0a0a0a] font-bold text-sm py-2.5 rounded-lg hover:bg-[#E0A800]/90 transition-colors mb-3"
      >
        Read the case study
      </Link>
      <Link
        href="/waitlist/course"
        className="block text-center border border-[#F4F1EA]/30 text-[#F4F1EA]/80 font-semibold text-sm py-2.5 rounded-lg hover:border-[#F4F1EA]/60 transition-colors"
      >
        Claim a Founding Spot
      </Link>
    </div>
  )
}

export function PostSidebar({ category, related }: { category: Category; related: PostMeta[] }) {
  return (
    <aside className="flex flex-col gap-5">
      {category === 'courses' && <CoursesCTA />}
      {category === 'golfers' && <GolfersCTA />}
      {category === 'case-studies' && <CaseStudyCTA />}

      {related.length > 0 && (
        <div className="bg-white rounded-xl p-5 ring-1 ring-black/5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Related</p>
          <div className="flex flex-col gap-3">
            {related.map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="text-sm font-semibold text-[#0F3D2E] hover:underline leading-snug">
                → {p.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
