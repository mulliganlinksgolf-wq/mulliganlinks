import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerPreferences } from '@/types/partners'
import { PreferencesForm } from './PreferencesForm'

export const metadata: Metadata = { title: 'Partner Profile — TeeAhead' }

export default async function PreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'

  const [{ data: existing }, { data: profile }] = await Promise.all([
    supabase.from('partner_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Partner Profile</h1>
        <p className="text-[#8FA889] mt-1">
          Control how you appear to other members in Find a Partner.
        </p>
      </div>

      {tier === 'fairway' ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-white font-medium mb-2">Eagle or Ace membership required</p>
          <p className="text-[#8FA889] text-sm mb-4">
            Upgrade to Eagle to set your partner profile and appear in the feed.
          </p>
          <a href="/app/membership"
            className="inline-block bg-white text-[#1B4332] font-semibold px-6 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]">
            Upgrade to Eagle →
          </a>
        </div>
      ) : (
        <PreferencesForm
          existing={existing as PartnerPreferences | null}
          avatarUrl={(profile as any)?.avatar_url ?? null}
        />
      )}
    </div>
  )
}
