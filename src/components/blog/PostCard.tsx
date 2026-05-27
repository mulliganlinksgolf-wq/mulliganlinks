import Link from 'next/link'
import type { PostMeta } from '@/lib/blog'
import { AUTHORS } from '@/lib/authors'

const CATEGORY_LABELS: Record<string, string> = {
  courses: 'For Courses',
  golfers: 'For Golfers',
  'case-studies': 'Case Study',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PostCard({ post }: { post: PostMeta & { readingTime: number } }) {
  const author = AUTHORS[post.author]
  const initials = author.name.split(' ').map(n => n[0]).join('')

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white border border-[#0F3D2E]/10 rounded-xl p-6 hover:border-[#0F3D2E]/30 hover:shadow-[0_4px_24px_rgba(15,61,46,0.06)] transition-all"
    >
      <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-semibold mb-4">
        {CATEGORY_LABELS[post.category]}
      </p>

      <h2
        className="font-display text-[#0F3D2E] tracking-[-0.015em] leading-[1.15] flex-1 group-hover:underline underline-offset-[3px]"
        style={{ fontSize: 22, fontWeight: 400 }}
      >
        {post.title}
      </h2>

      <p className="mt-3 text-[14px] text-[#6B7770] leading-[1.55] line-clamp-2">
        {post.description}
      </p>

      <div className="mt-5 pt-4 border-t border-[#0F3D2E]/10 flex items-center gap-3">
        <span
          className="size-7 rounded-full bg-[#0F3D2E] text-[#E0A800] flex items-center justify-center font-display text-[11px] tracking-[0.04em]"
          style={{ fontWeight: 400 }}
        >
          {initials}
        </span>
        <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[#6B7770]">
          <span className="text-[#0F3D2E] font-semibold">{author.name.split(' ')[0]}</span>
          <span className="mx-1.5 text-[#0F3D2E]/30">·</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span className="mx-1.5 text-[#0F3D2E]/30">·</span>
          <span>{post.readingTime} min</span>
        </div>
      </div>
    </Link>
  )
}
