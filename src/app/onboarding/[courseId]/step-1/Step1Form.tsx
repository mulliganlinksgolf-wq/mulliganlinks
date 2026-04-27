'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepHeader from '@/components/onboarding/StepHeader'
import OnboardingNav from '@/components/onboarding/OnboardingNav'
import { saveStep1 } from '@/lib/actions/onboarding'
import type { CourseOnboarding } from '@/lib/db/courses'

type Props = {
  courseId: string
  initial: CourseOnboarding | null
}

const INPUT =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-full'
const LABEL = 'text-xs text-gray-500 block mb-1'

export default function Step1Form({ courseId, initial }: Props) {
  const router = useRouter()

  const [name, setName] = useState(initial?.name ?? '')
  const [legalEntityName, setLegalEntityName] = useState(initial?.legal_entity_name ?? '')
  const [gmName, setGmName] = useState(initial?.gm_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [billingEmail, setBillingEmail] = useState(initial?.billing_email ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [zip, setZip] = useState(initial?.zip ?? '')
  const [taxId, setTaxId] = useState(initial?.tax_id ?? '')
  const [holes, setHoles] = useState<number>(initial?.holes ?? 18)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  function validate() {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Course name is required.'
    if (!gmName.trim()) next.gmName = 'GM / owner name is required.'
    if (!email.trim()) {
      next.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Please enter a valid email address.'
    }
    return next
  }

  async function handleContinue() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setIsLoading(true)
    try {
      await saveStep1(courseId, {
        name,
        legalEntityName,
        gmName,
        email,
        phone,
        billingEmail,
        website,
        address,
        city,
        state,
        zip,
        taxId,
        holes,
      })
      router.push(`/onboarding/${courseId}/step-2`)
    } catch (err) {
      console.error(err)
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader step={1} title="Business details" subtitle="Basic info about your course and business." />

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Course name *</label>
            <input
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pebble Beach Golf Links"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={LABEL}>Legal entity name</label>
            <input
              className={INPUT}
              value={legalEntityName}
              onChange={(e) => setLegalEntityName(e.target.value)}
              placeholder="Pebble Beach Company LLC"
            />
          </div>
          <div>
            <label className={LABEL}>GM / owner name *</label>
            <input
              className={INPUT}
              value={gmName}
              onChange={(e) => setGmName(e.target.value)}
              placeholder="Jane Smith"
            />
            {errors.gmName && <p className="text-xs text-red-500 mt-1">{errors.gmName}</p>}
          </div>
          <div>
            <label className={LABEL}>Direct phone</label>
            <input
              className={INPUT}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              type="tel"
            />
          </div>
          <div>
            <label className={LABEL}>Email address *</label>
            <input
              className={INPUT}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@course.com"
              type="email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={LABEL}>Billing email</label>
            <input
              className={INPUT}
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@course.com"
              type="email"
            />
          </div>
          <div>
            <label className={LABEL}>Website URL</label>
            <input
              className={INPUT}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.course.com"
              type="url"
            />
          </div>
          <div>
            <label className={LABEL}>Address</label>
            <input
              className={INPUT}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1700 17-Mile Drive"
            />
          </div>
          <div>
            <label className={LABEL}>City</label>
            <input
              className={INPUT}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Pebble Beach"
            />
          </div>
          <div>
            <label className={LABEL}>State</label>
            <input
              className={INPUT}
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="CA"
              maxLength={2}
            />
          </div>
          <div>
            <label className={LABEL}>ZIP</label>
            <input
              className={INPUT}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="93953"
            />
          </div>
          <div>
            <label className={LABEL}>Tax ID / EIN</label>
            <input
              className={INPUT}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="12-3456789"
            />
          </div>
          <div>
            <label className={LABEL}>Number of holes</label>
            <select
              className={INPUT}
              value={holes}
              onChange={(e) => setHoles(Number(e.target.value))}
            >
              <option value={9}>9</option>
              <option value={18}>18</option>
              <option value={27}>27</option>
              <option value={36}>36</option>
            </select>
          </div>
        </div>

        {errors.form && (
          <p className="text-xs text-red-500">{errors.form}</p>
        )}
      </div>

      <OnboardingNav
        courseId={courseId}
        onContinue={handleContinue}
        isLoading={isLoading}
      />
    </div>
  )
}
