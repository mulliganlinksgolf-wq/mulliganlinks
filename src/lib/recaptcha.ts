const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY

export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not set — skipping verification')
    return true
  }

  if (!token) {
    console.warn('[recaptcha] empty token received — reCAPTCHA script may not have loaded on client')
    return false
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
    })

    const data = await res.json()
    if (!data.success) {
      console.warn('[recaptcha] verification failed:', data['error-codes'])
    }
    return data.success === true && (data.score ?? 0) >= 0.3
  } catch (err) {
    console.error('[recaptcha] fetch error:', err)
    // Allow through on network error so infra issues don't block signups
    return true
  }
}
