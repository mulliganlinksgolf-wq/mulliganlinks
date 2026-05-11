'use client'

import { useState } from 'react'
import type { PostMeta } from '@/lib/blog'
import { PostCard } from './PostCard'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'courses', label: 'For Courses' },
  { key: 'golfers', label: 'For Golfers' },
  { key: 'case-studies', label: 'Case Studies' },
] as const

export function CategoryFilter({ posts }: { posts: (PostMeta & { readingTime: number })[] }) {
  const [active, setActive] = useState<string>('all')
  const filtered = active === 'all' ? posts : posts.filter(p => p.category === active)

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              active === f.key
                ? 'bg-[#0F3D2E] text-[#F4F1EA]'
                : 'bg-[#F4F1EA] text-[#0F3D2E] border border-[#ddd] hover:border-[#0F3D2E]/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
