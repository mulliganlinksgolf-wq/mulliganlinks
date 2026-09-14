'use client'

import LogRocket from 'logrocket'
import { track } from '@vercel/analytics'

type WaitlistEvent = 'golfer_waitlist_started' | 'golfer_waitlist_submitted' | 'golfer_waitlist_succeeded' | 'golfer_waitlist_failed' | 'golfer_waitlist_already_joined'

// Only fixed metadata belongs here; never send email, ZIP, or other form values.
export function trackWaitlist(event: WaitlistEvent, reason?: string) {
  const properties = { form: 'golfer', ...(reason ? { reason } : {}) }
  try { LogRocket.track(event, properties) } catch { /* Tracking must not block signup. */ }
  try { track(event, properties) } catch { /* Tracking must not block signup. */ }
}
