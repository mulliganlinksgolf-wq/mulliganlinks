import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Member Card' }

const TIER_LABEL: Record<string, string> = { ace: 'Ace', eagle: 'Eagle', fairway: 'Fairway' }
const TIER_MULT: Record<string, string> = { ace: '2×', eagle: '1.5×', fairway: '1×' }
const TIER_BG: Record<string, string> = {
  ace: 'bg-[#1B4332]',
  eagle: 'bg-[#1A1A1A]',
  fairway: 'bg-[#3D5A4E]',
}

export default async function MemberCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: membership }, { data: pointRows }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('memberships').select('tier, status, current_period_end').eq('user_id', user.id).single(),
    supabase.from('fairway_points').select('amount').eq('user_id', user.id),
  ])

  const tier = membership?.tier ?? 'fairway'
  const balance = (pointRows ?? []).reduce((s: number, r: any) => s + r.amount, 0)
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const shortId = user.id.slice(0, 8).toUpperCase()

  // Generate QR encoding the member lookup URL
  const qrData = `https://teeahead.com/checkin/${user.id}`
  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: { dark: '#1B4332', light: '#ffffff' },
  })

  return (
    <div className="max-w-sm mx-auto rounded-xl overflow-hidden" style={{ background: '#1C1C1C' }}>
      {/* Header label */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans">Member Card</p>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#555' }}>
          Show this at check-in to earn Fairway Points.
        </p>
      </div>

      {/* Physical card — unchanged */}
      <div className="px-4">
        <div className={`${TIER_BG[tier]} rounded-2xl p-6 text-[#FAF7F2] shadow-xl relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-8 size-48 rounded-full bg-white/5" />
          <div className="relative space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#FAF7F2]/60 text-xs uppercase tracking-widest font-medium">TeeAhead</p>
                <p className="text-2xl font-bold mt-1">{profile?.full_name ?? 'Member'}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-white/15 rounded-full px-3 py-1 text-sm font-bold">
                  {TIER_LABEL[tier]}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{balance.toLocaleString()}</p>
                <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Points</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{TIER_MULT[tier]}</p>
                <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Multiplier</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-sm font-bold leading-tight">
                  {memberSince.split(' ')[0]}<br />{memberSince.split(' ')[1]}
                </p>
                <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Member since</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[#FAF7F2]/60 text-xs uppercase tracking-widest">Member ID</p>
                <p className="font-mono font-bold text-lg mt-0.5">ML-{shortId}</p>
              </div>
              <div className="bg-white rounded-xl p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Member QR code" width={72} height={72} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works — dark surface */}
      <div className="mx-4 mt-4 rounded-xl p-5 space-y-3" style={{ background: '#2a2a2a' }}>
        <h2 className="font-bold text-sm font-sans" style={{ color: '#888' }}>How it works</h2>
        <ul className="space-y-2 text-sm font-sans" style={{ color: '#ddd' }}>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">1.</span>
            Show this card to the course staff when you check in.
          </li>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">2.</span>
            They look you up by name, email, or scan your QR.
          </li>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">3.</span>
            Fairway Points are automatically awarded at your {TIER_MULT[tier]} multiplier.
          </li>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">4.</span>
            100 points = $1 toward future rounds.
          </li>
        </ul>
      </div>

      {/* Upgrade nudge — dark surface with gold accent */}
      {tier === 'fairway' && (
        <div
          className="mx-4 mt-3 mb-4 rounded-xl p-5 space-y-2 border border-[#E0A800]/40"
          style={{ background: '#2a2a2a' }}
        >
          <p className="font-bold text-sm font-sans" style={{ color: '#E0A800' }}>
            Earn 1.5× points with Eagle
          </p>
          <p className="text-sm font-sans" style={{ color: '#888' }}>
            Upgrade to Eagle for 1.5× Fairway Points, $120/yr in tee time credits, and priority booking.
          </p>
          <a
            href="/app/membership"
            className="inline-flex items-center text-sm font-semibold font-sans"
            style={{ color: '#8FA889' }}
          >
            Upgrade for $89/yr →
          </a>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-4" style={{ background: '#1C1C1C' }} />
    </div>
  )
}
