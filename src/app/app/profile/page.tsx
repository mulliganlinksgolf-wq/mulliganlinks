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

  const tierLabel = membership?.tier === 'ace' ? 'Ace' : membership?.tier === 'eagle' ? 'Eagle' : 'Fairway'
  const tierColor = membership?.tier === 'ace' ? '#8FA889' : membership?.tier === 'eagle' ? '#E0A800' : '#8FA889'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-lg">
      {/* Dark header */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: '#1C1C1C' }}>
        <div className="px-5 py-5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">Profile</p>
          <h1 className="text-2xl font-bold font-serif text-white italic">
            {profile?.full_name ?? 'Your profile'}
          </h1>
          <p className="text-[11px] font-sans mt-1">
            <span style={{ color: tierColor }}>{tierLabel} Member</span>
            <span style={{ color: '#555' }}> · Member since {memberSince}</span>
          </p>
        </div>
      </div>

      {/* Form stays light */}
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
