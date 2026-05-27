'use client'
import { useActionState } from 'react'
import { saveProfile } from '@/app/admin/users/[userId]/actions'

interface ProfileTabProps {
  userId: string
  profile: {
    id: string; full_name: string | null; email: string; phone: string | null
    home_course_id: string | null; is_admin: boolean; founding_member: boolean
    stripe_customer_id: string | null
  }
  courses: { id: string; name: string }[]
  homeCourse: { id: string; name: string } | null
}

export default function ProfileTab({ userId, profile, courses }: ProfileTabProps) {
  const [state, action, pending] = useActionState(saveProfile, {})

  return (
    <form action={action} className="space-y-5 max-w-lg">
      <input type="hidden" name="userId" value={userId} />

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-[#1A1A1A] mb-1">Full Name</label>
        <input id="full_name" name="full_name" type="text" defaultValue={profile.full_name ?? ''}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input id="email" name="email" type="email" defaultValue={profile.email}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30" />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30" />
      </div>

      <div>
        <label htmlFor="home_course_id" className="block text-sm font-medium text-[#1A1A1A] mb-1">Home Course</label>
        <select id="home_course_id" name="home_course_id" defaultValue={profile.home_course_id ?? ''}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none">
          <option value="">— None —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="stripe_customer_id" className="block text-sm font-medium text-[#1A1A1A] mb-1">
          Stripe Customer ID <span className="text-[#6B7770] font-normal">(read-only)</span>
        </label>
        <input id="stripe_customer_id" type="text" value={profile.stripe_customer_id ?? '—'} readOnly
          className="w-full rounded-lg border border-black/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#6B7770]" />
      </div>

      <div>
        <label htmlFor="user_id_display" className="block text-sm font-medium text-[#1A1A1A] mb-1">
          User ID <span className="text-[#6B7770] font-normal">(read-only)</span>
        </label>
        <input id="user_id_display" type="text" value={userId} readOnly
          className="w-full rounded-lg border border-black/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#6B7770]" />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="founding_member" value="false" />
          <input type="checkbox" name="founding_member" value="true" defaultChecked={profile.founding_member} className="rounded" />
          Founding Member
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_admin" value="false" />
          <input type="checkbox" name="is_admin" value="true" defaultChecked={profile.is_admin} className="rounded" />
          Admin Access
        </label>
      </div>

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Changes saved.</p>}

      <button type="submit" disabled={pending}
        className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-5 py-2 text-sm font-semibold hover:bg-[#1B4332]/90 transition-colors disabled:opacity-50">
        {pending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
