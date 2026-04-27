import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, founding_member')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">My Profile</h1>
      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.full_name ?? ''}
        initialPhone={profile?.phone ?? ''}
        isFoundingMember={profile?.founding_member ?? false}
        membership={membership ?? null}
      />
    </div>
  )
}
