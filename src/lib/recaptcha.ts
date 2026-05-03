const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY

export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not set — skipping verification')
    return true
  }

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
  })

  const data = await res.json()
  return data.success === true && (data.score ?? 0) >= 0.5
}
