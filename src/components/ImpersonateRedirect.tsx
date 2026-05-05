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

    // Only redirect after SIGNED_IN fires — do not use getSession() as a
    // fallback here because the admin is already signed in as themselves,
    // and getSession() would return *their* session immediately, redirecting
    // to /app before the magic-link tokens in the hash establish Dave's session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe()
        go()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
