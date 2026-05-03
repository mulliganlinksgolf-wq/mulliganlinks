'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Handles admin impersonation magic links that land on the home page.
// Supabase always allows redirects to the Site URL so we use it as the relay,
// then forward to /app once the session is established from the hash tokens.
export function ImpersonateRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Must run client-side — hash is never visible during SSR
    if (!window.location.hash.includes('type=magiclink')) return

    const supabase = createClient()
    let redirected = false

    const go = () => {
      if (redirected) return
      redirected = true
      router.replace('/app')
    }

    // Subscribe first to avoid missing the event due to a race
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe()
        go()
      }
    })

    // In case the session was already established before we subscribed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go()
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
