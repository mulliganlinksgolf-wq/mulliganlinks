import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, slug, city, state, address, base_green_fee, hero_image_url')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Partner Courses</h1>
        <p className="text-[#6B7770] mt-1">Book tee times with zero booking fees.</p>
      </div>

      {!courses || courses.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <p className="text-[#6B7770]">No courses in your area yet — we&apos;re growing.</p>
            <p className="text-sm text-[#6B7770] mt-2">Check back soon or tell your home course about TeeAhead.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Link key={course.id} href={`/app/courses/${course.slug}`}>
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="h-36 bg-[#1B4332]/10 rounded-t-lg flex items-center justify-center">
                  {course.hero_image_url ? (
                    <img src={course.hero_image_url} alt={course.name} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <span className="text-4xl">⛳</span>
                  )}
                </div>
                <CardContent className="pt-4 pb-4">
                  <h2 className="font-semibold text-[#1A1A1A]">{course.name}</h2>
                  <p className="text-sm text-[#6B7770] mt-0.5">{course.city}, {course.state}</p>
                  {course.base_green_fee && (
                    <p className="text-sm font-medium text-[#1B4332] mt-2">From ${course.base_green_fee.toFixed(2)}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
