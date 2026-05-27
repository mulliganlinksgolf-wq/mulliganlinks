import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Courses on TeeAhead',
  description: 'Find your home course. Book direct, save 15% with the TeeAhead pass.',
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('name, slug, city, state')
    .eq('status', 'active')
    .order('name')

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase">
        TeeAhead Partner Courses
      </p>
      <h1 className="font-display text-[40px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[#0F3D2E] mt-3">
        Find your course.
      </h1>
      <p className="mt-4 text-[15px] text-[#1A1A1A]/82 leading-[1.6]">
        Book direct. Save 15% every round with the TeeAhead pass.
      </p>

      <ul className="divide-y divide-[#0F3D2E]/10 mt-8">
        {(courses ?? []).map((c) => (
          <li key={c.slug}>
            <Link
              href={`/play/${c.slug}`}
              className="flex items-baseline justify-between py-4 hover:bg-[#0F3D2E]/5 px-2 -mx-2 rounded transition-colors"
            >
              <span className="font-display text-[20px] text-[#0F3D2E]">{c.name}</span>
              {(c.city || c.state) && (
                <span className="text-[13px] text-[#0F3D2E]/60">
                  {[c.city, c.state].filter(Boolean).join(', ')}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
