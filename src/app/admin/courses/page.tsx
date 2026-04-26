import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Courses' }

async function toggleCourse(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const active = formData.get('active') === 'true'
  await supabase.from('courses').update({ active: !active }).eq('id', id)
  revalidatePath('/admin/courses')
}

export default async function AdminCoursesPage() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, city, state, active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Partner Courses</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          Active courses appear in the member booking flow. Inactive courses are hidden from members.
        </p>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Course</th>
                <th className="text-left px-5 py-3 font-medium">Location</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {courses && courses.length > 0 ? courses.map((c: any) => (
                <tr key={c.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#1A1A1A]">{c.name}</td>
                  <td className="px-5 py-3 text-[#6B7770]">{c.city}, {c.state}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.active ? 'bg-[#1B4332]/10 text-[#1B4332]' : 'bg-black/5 text-[#6B7770]'
                    }`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#6B7770]">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <form action={toggleCourse}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={String(c.active)} />
                      <button
                        type="submit"
                        className="text-xs text-[#1B4332] hover:underline font-medium"
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[#6B7770]">No courses added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
