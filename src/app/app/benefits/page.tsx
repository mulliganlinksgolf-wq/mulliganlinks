import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { issueIfBirthdayToday } from '@/app/actions/birthdayCredit'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Benefits' }

const BOOKING_FEE = 1.49
const FREE_ROUND_VALUE = 45 // estimated average green fee

function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100)
  return (
    <div className="w-full h-1.5 rounded-full bg-[#0f2d1d] mt-2">
      <div className="h-1.5 rounded-full bg-[#8FA889] transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function BenefitCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-3" style={{ background: '#163d2a' }}>
      <p className="text-[9px] uppercase tracking-[0.2em] font-sans" style={{ color: '#8FA889' }}>{title}</p>
      {children}
    </div>
  )
}

export default async function BenefitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, created_at, comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'fairway'
  const isPaid = tier === 'eagle' || tier === 'ace'

  const COMP_DEFAULT_ALLOTMENT: Record<string, number> = { eagle: 1, ace: 2 }
  const compAllotment = COMP_DEFAULT_ALLOTMENT[tier] ?? 0
  const compResetAt = membership?.comp_rounds_reset_at
    ? new Date(membership.comp_rounds_reset_at)
    : null
  const compRoundsRemaining = compResetAt && compResetAt < new Date()
    ? compAllotment
    : (membership?.comp_rounds_remaining ?? 0)
  const compRoundsUsed = compAllotment - compRoundsRemaining

  // Issue birthday credit if today is the member's birthday
  if (isPaid) await issueIfBirthdayToday(user.id, tier)

  const [
    { data: bookings },
    { data: points },
    { data: credits },
    { data: passes },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, platform_fee_cents, discount_cents, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'completed']),
    supabase
      .from('fairway_points')
      .select('amount')
      .eq('user_id', user.id)
      .gt('amount', 0),
    supabase
      .from('member_credits')
      .select('type, amount_cents, status, expires_at, created_at')
      .eq('user_id', user.id),
    supabase
      .from('guest_passes')
      .select('id, issued_at, expires_at, redeemed_at, booking_id')
      .eq('user_id', user.id)
      .order('issued_at'),
  ])

  const allBookings = bookings ?? []
  const allCredits = credits ?? []
  const allPasses = passes ?? []

  // --- Savings calculations ---
  const bookingFeeSaved = isPaid ? allBookings.length * BOOKING_FEE : 0

  const guestPassSaved = allPasses.filter(p => p.redeemed_at).length * 15

  const freeRoundsUsed = allCredits.filter(c => c.type === 'free_round' && c.status === 'used').length
  const freeRoundsSaved = freeRoundsUsed * FREE_ROUND_VALUE

  const birthdayCreditUsed = allCredits
    .filter(c => c.type === 'birthday' && c.status === 'used')
    .reduce((s, c) => s + c.amount_cents / 100, 0)

  const pointsValue = (points ?? []).reduce((s, p) => s + p.amount, 0) / 100

  const monthlyCreditsTotal = allCredits
    .filter(c => c.type === 'monthly')
    .reduce((s, c) => s + c.amount_cents / 100, 0)

  const totalSaved = bookingFeeSaved + guestPassSaved + freeRoundsSaved + birthdayCreditUsed + pointsValue + monthlyCreditsTotal

  // --- Guest pass data ---
  const passesAllotment = tier === 'ace' ? 2 : tier === 'eagle' ? 1 : 0
  const passesUsed = allPasses.filter(p => p.redeemed_at).length
  const passesAvailable = allPasses.filter(p => !p.redeemed_at && new Date(p.expires_at) > new Date())

  // --- Complimentary rounds ---
  const roundsAllotment = tier === 'ace' ? 2 : tier === 'eagle' ? 1 : 0
  const freeRoundCredits = allCredits.filter(c => c.type === 'free_round')
  const roundsUsedCount = freeRoundCredits.filter(c => c.status === 'used').length

  // --- Birthday credit ---
  const birthdayCredit = allCredits.find(c => c.type === 'birthday' && new Date(c.expires_at) > new Date())
  const birthdayAmount = tier === 'ace' ? 20 : tier === 'eagle' ? 10 : 0

  // --- Member since ---
  const memberSince = membership?.created_at
    ? new Date(membership.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">Benefits</p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Your benefits.</h1>
        <p className="text-[11px] font-sans mt-1 text-[#8FA889]">Since {memberSince}</p>
      </div>

      {/* Hero savings */}
      <div className="rounded-xl p-6 mb-6" style={{ background: '#1B4332' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] font-sans mb-1" style={{ color: '#8FA889' }}>Total saved with TeeAhead</p>
        <p className="text-4xl font-bold font-serif text-white">${totalSaved.toFixed(2)}</p>
      </div>

      {!isPaid && (
        <div className="rounded-xl p-5 mb-6 text-center" style={{ background: '#163d2a' }}>
          <p className="text-sm font-sans text-[#8FA889]">Upgrade to Eagle or Ace to unlock guest passes, birthday credits, and more.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Booking fee waivers */}
        <BenefitCard title="Booking Fee Waivers">
          <p className="text-2xl font-bold font-serif text-white">${bookingFeeSaved.toFixed(2)}</p>
          <p className="text-xs font-sans text-[#8FA889]">saved across {allBookings.length} round{allBookings.length !== 1 ? 's' : ''}</p>
          <p className="text-xs font-sans" style={{ color: '#555' }}>Never pay a booking fee</p>
        </BenefitCard>

        {/* Guest passes */}
        {isPaid && (
          <BenefitCard title="Guest Passes">
            <p className="text-2xl font-bold font-serif text-white">{passesUsed} <span className="text-base font-sans text-[#8FA889]">of {passesAllotment} used</span></p>
            <ProgressBar used={passesUsed} total={passesAllotment} />
            <div className="space-y-2 mt-2">
              {allPasses.map(p => (
                <div key={p.id} className={`flex items-center gap-2 text-xs font-sans ${p.redeemed_at ? 'opacity-40' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.redeemed_at ? 'bg-[#555]' : 'bg-[#8FA889]'}`} />
                  <span className={p.redeemed_at ? 'line-through text-[#555]' : 'text-[#ddd]'}>
                    Guest Pass
                  </span>
                  <span className="text-[#555] ml-auto">
                    {p.redeemed_at
                      ? `Used ${new Date(p.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : `Expires ${new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  </span>
                </div>
              ))}
            </div>
            {passesAvailable.length > 0 && (
              <p className="text-xs font-semibold font-sans mt-1" style={{ color: '#E0A800' }}>
                {passesAvailable.length} unused pass{passesAvailable.length !== 1 ? 'es' : ''}
              </p>
            )}
          </BenefitCard>
        )}

        {/* Complimentary rounds */}
        {isPaid && (
          <BenefitCard title="Complimentary Rounds">
            <div className="space-y-1.5">
              {Array.from({ length: compAllotment }, (_, i) => {
                const isUsed = i < compRoundsUsed
                return (
                  <div key={i} className={`flex items-center gap-2 text-xs font-sans ${isUsed ? 'opacity-40' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isUsed ? 'bg-[#555]' : 'bg-[#8FA889]'}`} />
                    <span className={isUsed ? 'line-through text-[#555]' : 'text-[#ddd]'}>
                      Round {i + 1}
                    </span>
                  </div>
                )
              })}
            </div>
            {compResetAt && compResetAt > new Date() && (
              <p className="text-[10px] font-sans mt-2" style={{ color: '#555' }}>
                Resets {compResetAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </BenefitCard>
        )}

        {/* Fairway upgrade prompt */}
        {!isPaid && (
          <BenefitCard title="Free Rounds">
            <p className="text-xs font-sans text-[#8FA889]">
              Earn 5,000 points for a free round at participating courses.
            </p>
            <p className="text-[10px] font-sans mt-1" style={{ color: '#555' }}>
              Upgrade to Eagle or Ace for included complimentary rounds.
            </p>
          </BenefitCard>
        )}

        {/* Birthday credit */}
        {isPaid && (
          <BenefitCard title="Birthday Credit">
            <p className="text-2xl font-bold font-serif text-white">${birthdayAmount}</p>
            {birthdayCredit ? (
              birthdayCredit.status === 'used' ? (
                <p className="text-xs font-sans text-[#555]">Used this year</p>
              ) : (
                <>
                  <p className="text-xs font-sans" style={{ color: '#8FA889' }}>
                    Available · expires {new Date(birthdayCredit.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-semibold font-sans" style={{ color: '#E0A800' }}>Ready to use</p>
                </>
              )
            ) : (
              <p className="text-xs font-sans text-[#555]">Issued automatically on your birthday each year.</p>
            )}
          </BenefitCard>
        )}

        {/* Fairway Points */}
        <BenefitCard title="Fairway Points">
          <p className="text-2xl font-bold font-serif text-white">${pointsValue.toFixed(2)}</p>
          <p className="text-xs font-sans text-[#8FA889]">earned lifetime</p>
          <p className="text-xs font-sans text-[#555]">100 pts = $1 toward future rounds</p>
        </BenefitCard>

        {/* Monthly credits */}
        {isPaid && (
          <BenefitCard title="Monthly Credits">
            <p className="text-2xl font-bold font-serif text-white">${monthlyCreditsTotal.toFixed(2)}</p>
            <p className="text-xs font-sans text-[#8FA889]">issued lifetime</p>
            <p className="text-xs font-sans text-[#555]">${tier === 'ace' ? 20 : 10}/mo toward tee times</p>
          </BenefitCard>
        )}

      </div>
    </div>
  )
}
