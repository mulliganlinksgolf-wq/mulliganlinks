// src/app/app/courses/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, slug, city, state, address, base_green_fee, hero_image_url')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Dark header */}
      <div className="px-5 py-5" style={{ background: '#1C1C1C' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">
          Partner Courses
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Find your round.</h1>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#8FA889' }}>
          Zero booking fees, always.
        </p>
      </div>

      {/* Content */}
      <div className="p-4" style={{ background: '#1C1C1C' }}>
        {!courses || courses.length === 0 ? (
          <div className="rounded-lg p-12 text-center" style={{ background: '#2a2a2a' }}>
            <p style={{ color: '#888' }}>No courses in your area yet — we&apos;re growing.</p>
            <p className="text-sm mt-2" style={{ color: '#555' }}>
              Check back soon or tell your home course about TeeAhead.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <Link key={course.id} href={`/app/courses/${course.slug}`}>
                <div
                  className="rounded-lg overflow-hidden transition-colors cursor-pointer hover:bg-[#333]"
                  style={{ background: '#2a2a2a' }}
                >
                  <div
                    className="h-36 flex items-center justify-center overflow-hidden"
                    style={{ background: '#1B4332' }}
                  >
                    {course.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.hero_image_url as string}
                        alt={course.name as string}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">⛳</span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <h2 className="font-semibold text-white text-sm">{course.name as string}</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {course.city as string}, {course.state as string}
                    </p>
                    {course.base_green_fee && (
                      <p className="text-xs font-medium mt-2" style={{ color: '#8FA889' }}>
                        From ${(course.base_green_fee as number).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
