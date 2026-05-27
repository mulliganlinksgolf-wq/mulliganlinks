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

    const params = new URLSearchParams(window.location.hash.slice(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return

    const supabase = createClient()

    // @supabase/ssr's browser client is PKCE-flow by default and does NOT
    // auto-process implicit-flow hash tokens, so setSession() manually.
    // This also overwrites the admin's existing session with the target
    // member's session in cookies, which the SSR /app page then reads.
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        console.error('Impersonation setSession failed', error)
        return
      }
      // Clear the hash so a refresh doesn't try to re-process it
      history.replaceState(null, '', window.location.pathname)
      router.replace('/app')
    })
  }, [router])

  return null
}
