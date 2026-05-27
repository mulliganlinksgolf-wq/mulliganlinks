'use client'

import { usePathname } from 'next/navigation'
import OnboardingProgressBar from './OnboardingProgressBar'

export default function OnboardingProgressBarNav() {
  const pathname = usePathname()
  const match = pathname.match(/\/step-(\d+)$/)
  if (!match) return null
  const step = Math.min(parseInt(match[1], 10), 5)
  return <OnboardingProgressBar currentStep={step} />
}
