import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Member Card' }

const TIER_LABEL: Record<string, string> = { ace: 'Ace', eagle: 'Eagle', fairway: 'Fairway' }
const TIER_MULT: Record<string, string> = { ace: '3×', eagle: '2×', fairway: '1×' }
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
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My member card</h1>
        <p className="text-[#6B7770] text-sm mt-1">Show this to course staff to earn Fairway Points.</p>
      </div>

      {/* Card */}
      <div className={`${TIER_BG[tier]} rounded-2xl p-6 text-[#FAF7F2] shadow-xl relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-8 size-48 rounded-full bg-white/5" />

        <div className="relative space-y-6">
          {/* Header */}
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

          {/* Stats row */}
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
              <p className="text-sm font-bold leading-tight">{memberSince.split(' ')[0]}<br />{memberSince.split(' ')[1]}</p>
              <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Member since</p>
            </div>
          </div>

          {/* QR + ID */}
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

      {/* How to use */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
        <h2 className="font-bold text-[#1A1A1A] text-sm">How it works</h2>
        <ul className="space-y-2 text-sm text-[#6B7770]">
          <li className="flex gap-2">
            <span className="text-[#1B4332] font-bold">1.</span>
            Show this card to the course staff when you check in.
          </li>
          <li className="flex gap-2">
            <span className="text-[#1B4332] font-bold">2.</span>
            They look you up by name, email, or scan your QR.
          </li>
          <li className="flex gap-2">
            <span className="text-[#1B4332] font-bold">3.</span>
            Fairway Points are automatically awarded at your {TIER_MULT[tier]} multiplier based on your green fee.
          </li>
          <li className="flex gap-2">
            <span className="text-[#1B4332] font-bold">4.</span>
            100 points = $1 toward future rounds.
          </li>
        </ul>
      </div>

      {/* Upgrade nudge for free tier */}
      {tier === 'fairway' && (
        <div className="bg-[#E0A800]/10 border border-[#E0A800]/30 rounded-xl p-5 space-y-2">
          <p className="font-bold text-[#1A1A1A] text-sm">Earn twice as fast with Eagle</p>
          <p className="text-sm text-[#6B7770]">
            Upgrade to Eagle for 2× Fairway Points on every round, plus $180/yr in tee time credits and priority booking.
          </p>
          <a
            href="/app/membership"
            className="inline-flex items-center text-sm font-semibold text-[#1B4332] hover:underline"
          >
            Upgrade for $79/yr →
          </a>
        </div>
      )}
    </div>
  )
}
