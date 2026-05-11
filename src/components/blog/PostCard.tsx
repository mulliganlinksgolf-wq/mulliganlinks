import Link from 'next/link'
import type { PostMeta } from '@/lib/blog'
import { AUTHORS } from '@/lib/authors'

const CATEGORY_STYLES: Record<string, { band: string; label: string; icon: string }> = {
  courses: { band: 'bg-[#0F3D2E]', label: 'text-[#E0A800]', icon: '⛳' },
  golfers: { band: 'bg-[#FAF7F2] border border-[#e0e0e0]', label: 'text-[#0F3D2E]', icon: '🏌️' },
  'case-studies': { band: 'bg-[#E0A800]', label: 'text-[#0a0a0a]', icon: '📈' },
}

const CATEGORY_LABELS: Record<string, string> = {
  courses: 'For Courses',
  golfers: 'For Golfers',
  'case-studies': 'Case Study',
}

export function PostCard({ post }: { post: PostMeta & { readingTime: number } }) {
  const style = CATEGORY_STYLES[post.category]
  const author = AUTHORS[post.author]
  return (
    <Link href={`/blog/${post.slug}`} className="group bg-white rounded-xl overflow-hidden ring-1 ring-black/5 hover:ring-[#0F3D2E]/30 hover:shadow-md transition-all flex flex-col">
      <div className={`h-12 flex items-center justify-center text-2xl ${style.band}`}>
        {style.icon}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${style.label}`}>
          {CATEGORY_LABELS[post.category]}
        </p>
        <h2 className="text-sm font-bold text-[#0F3D2E] leading-snug mb-3 group-hover:underline flex-1">
          {post.title}
        </h2>
        <p className="text-xs text-gray-500">
          {author.name.split(' ')[0]} · {post.readingTime} min read
        </p>
      </div>
    </Link>
  )
}
