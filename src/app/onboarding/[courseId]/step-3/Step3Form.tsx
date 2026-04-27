'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepHeader from '@/components/onboarding/StepHeader'
import OnboardingNav from '@/components/onboarding/OnboardingNav'
import PricingEditor, { DEFAULT_PRICING, type PricingRow } from '@/components/onboarding/PricingEditor'
import { saveStep3 } from '@/lib/actions/onboarding'
import type { CourseOnboarding } from '@/lib/db/courses'
import type { TeeSheetConfig, CoursePricing } from '@/lib/db/onboarding'

type Props = {
  courseId: string
  course: CourseOnboarding | null
  config: TeeSheetConfig | null
  dbPricing: CoursePricing[]
}

const INPUT =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-full'
const LABEL = 'text-xs text-gray-500 block mb-1'

function dbPricingToRows(dbPricing: CoursePricing[]): PricingRow[] {
  if (dbPricing.length === 0) return DEFAULT_PRICING
  return dbPricing.map((p) => ({
    id: crypto.randomUUID(),
    rateName: p.rate_name,
    greenFeeCents: p.green_fee_cents,
    cartFeeCents: p.cart_fee_cents,
  }))
}

export default function Step3Form({ courseId, config, dbPricing }: Props) {
  const router = useRouter()

  const [pricing, setPricing] = useState<PricingRow[]>(dbPricingToRows(dbPricing))
  const [cancellationWindowMinutes, setCancellationWindowMinutes] = useState<number>(
    config?.cancellation_window_minutes ?? 120,
  )
  const [rainCheckPolicy, setRainCheckPolicy] = useState<'full_credit' | 'half_credit' | 'none'>(
    config?.rain_check_policy ?? 'full_credit',
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    setIsLoading(true)
    setError(null)
    try {
      await saveStep3(courseId, {
        pricing: pricing.map((r, i) => ({
          rateName: r.rateName,
          greenFeeCents: r.greenFeeCents,
          cartFeeCents: r.cartFeeCents,
          displayOrder: i,
        })),
        cancellationWindowMinutes,
        rainCheckPolicy,
      })
      router.push(`/onboarding/${courseId}/step-4`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={3}
        title="Pricing"
        subtitle="Set your green fee and cart fee rates."
      />

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Rate categories
        </p>
        <PricingEditor value={pricing} onChange={setPricing} />

        <hr className="border-t border-gray-200" />

        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Cancellation policy
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Cancellation window</label>
            <select
              className={INPUT}
              value={cancellationWindowMinutes}
              onChange={(e) => setCancellationWindowMinutes(Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Rain check policy</label>
            <select
              className={INPUT}
              value={rainCheckPolicy}
              onChange={(e) =>
                setRainCheckPolicy(e.target.value as 'full_credit' | 'half_credit' | 'none')
              }
            >
              <option value="full_credit">Full credit</option>
              <option value="half_credit">50% credit</option>
              <option value="none">No rain checks</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <OnboardingNav
        courseId={courseId}
        prevStep={2}
        onContinue={handleContinue}
        isLoading={isLoading}
      />
    </div>
  )
}
