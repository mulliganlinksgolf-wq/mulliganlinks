'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PostMeta } from '@/lib/blog'
import { AUTHORS } from '@/lib/authors'
import { PostCard } from './PostCard'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'courses', label: 'For Courses' },
  { key: 'golfers', label: 'For Golfers' },
  { key: 'case-studies', label: 'Case Studies' },
] as const

const CATEGORY_LABELS: Record<string, string> = {
  courses: 'For Courses',
  golfers: 'For Golfers',
  'case-studies': 'Case Study',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Post = PostMeta & { readingTime: number }

export function CategoryFilter({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState<string>('all')
  const filtered = active === 'all' ? posts : posts.filter(p => p.category === active)

  const featured = active === 'all' ? posts[0] : null
  const rest = featured ? filtered.filter(p => p.slug !== featured.slug) : filtered

  return (
    <div>
      {/* Eyebrow pills */}
      <div className="flex flex-wrap gap-2 mb-12">
        {FILTERS.map(f => {
          const isActive = active === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`rounded-md px-3 py-1.5 font-mono text-[10.5px] tracking-[0.14em] uppercase font-semibold transition-colors ${
                isActive
                  ? 'bg-[#0F3D2E] text-[#F4F1EA]'
                  : 'border border-[#0F3D2E]/15 text-[#0F3D2E]/70 hover:text-[#0F3D2E] hover:border-[#0F3D2E]/30'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Featured */}
      {featured && <FeaturedCard post={featured} />}

      {/* Grid */}
      {rest.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        !featured && <p className="text-center text-[#6B7770]">No posts in this category yet.</p>
      )}
    </div>
  )
}

function FeaturedCard({ post }: { post: Post }) {
  const author = AUTHORS[post.author]
  const initials = author.name.split(' ').map(n => n[0]).join('')

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block mb-12 bg-[#082419] text-[#F4F1EA] rounded-2xl p-8 sm:p-12 hover:bg-[#0a2e22] transition-colors"
    >
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[#E0A800] font-bold">
            Featured · {CATEGORY_LABELS[post.category]}
          </span>
          <span className="flex-1 h-px bg-[#F4F1EA]/15" />
        </div>

        <h2
          className="font-display tracking-[-0.025em] leading-[1.05] text-[#F4F1EA] group-hover:underline underline-offset-[4px]"
          style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400 }}
        >
          {post.title}
        </h2>

        <p className="mt-5 text-[15px] sm:text-base text-[#F4F1EA]/78 leading-[1.6] line-clamp-2 max-w-2xl">
          {post.description}
        </p>

        <div className="mt-7 flex items-center gap-3">
          <span
            className="size-8 rounded-full bg-[#E0A800]/15 text-[#E0A800] flex items-center justify-center font-display text-[12px]"
            style={{ fontWeight: 400 }}
          >
            {initials}
          </span>
          <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#F4F1EA]/60">
            <span className="text-[#E0A800] font-semibold">{author.name}</span>
            <span className="mx-2 text-[#F4F1EA]/30">·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span className="mx-2 text-[#F4F1EA]/30">·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
