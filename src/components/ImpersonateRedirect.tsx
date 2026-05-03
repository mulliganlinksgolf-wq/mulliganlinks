'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Detects when an admin magic link lands on the home page and forwards to /app.
// Supabase always allows redirects to the Site URL, so we land here first,
// let the JS client establish the session from the hash tokens, then navigate.
export function ImpersonateRedirect() {
  const router = useRouter()
  const isMagicLink = useRef(
    typeof window !== 'undefined' && window.location.hash.includes('type=magiclink'),
  )

  useEffect(() => {
    if (!isMagicLink.current) return
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe()
        router.replace('/app')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return null
}
