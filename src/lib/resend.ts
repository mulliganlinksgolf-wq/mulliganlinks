import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_placeholder') return null
  return new Resend(key)
}

export async function sendAdminNotification({
  subject,
  html,
}: {
  subject: string
  html: string
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping email:', subject)
    return
  }

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: 'mulliganlinksgolf@gmail.com',
    subject,
    html,
  })
}

export async function sendWelcomeEmail({
  email,
  fullName,
}: {
  email: string
  fullName?: string
}) {
  const client = getResend()
  if (!client) return

  const firstName = fullName?.split(' ')[0] ?? 'there'

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: email,
    subject: 'Welcome to MulliganLinks — confirm your email to get started',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Welcome to MulliganLinks ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>You're in. MulliganLinks is the local-first golf membership built for golfers
        who actually play — at their home course, with their regular group, without
        paying extra for the privilege.</p>

        <p>Once you confirm your email, here's what you get on the Fairway (free) tier:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>Book tee times at partner courses with zero booking fees</li>
          <li>Earn 1× Fairway Points on every dollar played</li>
          <li>Free cancellation up to 1 hour out — always</li>
        </ul>

        <p>Ready to earn more? Upgrade to Eagle ($79/yr) for 2× points, priority booking,
        and $15/mo in tee time credits. Or go Ace ($149/yr) for 3× points, 72hr early
        access, and $25/mo in credits.</p>

        <p style="margin: 24px 0;">
          <a href="https://mulliganlinks.com/app"
             style="background: #1B4332; color: #FAF7F2; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Go to my dashboard →
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          MulliganLinks · Your home course, redone right.<br />
          Questions? Reply to this email or reach us at support@mulliganlinks.com
        </p>
      </div>
    `,
  })
}

export async function sendGolferWaitlistConfirmation({
  email,
  firstName,
  position,
}: {
  email: string
  firstName: string
  position: number
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping golfer waitlist email')
    return
  }

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: email,
    subject: `You're #${position} on the MulliganLinks waitlist ⛳`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">You're #${position} on the list ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>You're officially on the MulliganLinks waitlist. We're launching in Metro Detroit and you'll be
        among the first to know when we go live.</p>
        <p>Here's what you're waiting for:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>Zero booking fees at partner courses — forever</li>
          <li>Eagle membership ($79/yr) beats GolfPass+ ($119/yr) on every single metric</li>
          <li>Real Fairway Points on every dollar played at local courses</li>
        </ul>
        <p>Know a golf course that should partner with us? Send them to
        <a href="https://mulliganlinks.com/waitlist/course" style="color: #1B4332;">mulliganlinks.com/waitlist/course</a>.
        More partner courses = more value for you on day one.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          MulliganLinks · Your home course, redone right.<br />
          Questions? Reply to this email — we read every one.
        </p>
      </div>
    `,
  })
}

export async function sendCourseWaitlistConfirmation({
  email,
  contactName,
  courseName,
}: {
  email: string
  contactName: string
  courseName: string
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping course waitlist email')
    return
  }

  const firstName = contactName.split(' ')[0]

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: email,
    subject: `${courseName} — Founding Partner application received`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Application received 🏌️</h2>
        <p>Hey ${firstName},</p>
        <p>We received your Founding Partner application for <strong>${courseName}</strong>.
        Neil or Billy will be in touch within 48 hours to confirm your spot and walk you through
        what happens next.</p>
        <p>As a quick reminder, Founding Partners get:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>The full MulliganLinks platform — free for life</li>
          <li>Direct tee sheet connection (we handle the tech)</li>
          <li>Featured placement in our marketing to Metro Detroit golfers</li>
        </ul>
        <p>The only ask: tell your golfers about the MulliganLinks membership at booking.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          MulliganLinks · Your home course, redone right.<br />
          Questions? Reply to this email.
        </p>
      </div>
    `,
  })
}

export async function sendCourseAdminAlert({
  courseName,
  contactName,
  contactRole,
  email,
  phone,
  city,
  state,
  onGolfnow,
  estimatedBarterCost,
  biggestFrustration,
}: {
  courseName: string
  contactName: string
  contactRole: string | null
  email: string
  phone: string | null
  city: string | null
  state: string | null
  onGolfnow: boolean
  estimatedBarterCost: number | null
  biggestFrustration: string | null
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping course admin alert')
    return
  }

  const barterLine = estimatedBarterCost
    ? `<p><strong>Est. annual GolfNow barter cost:</strong> $${estimatedBarterCost.toLocaleString()}</p>`
    : ''

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: ['neil@mulliganlinks.com', 'billy@mulliganlinks.com'],
    subject: `New course application: ${courseName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">New course waitlist application</h2>
        <p><strong>Course:</strong> ${courseName}</p>
        <p><strong>Contact:</strong> ${contactName}${contactRole ? ` (${contactRole})` : ''}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${city || state ? `<p><strong>Location:</strong> ${[city, state].filter(Boolean).join(', ')}</p>` : ''}
        <p><strong>On GolfNow:</strong> ${onGolfnow ? 'Yes' : 'No'}</p>
        ${barterLine}
        ${biggestFrustration ? `<p><strong>Biggest frustration:</strong><br /><em>${biggestFrustration}</em></p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p><a href="https://mulliganlinks.com/admin/waitlist" style="color: #1B4332;">Review and approve in admin panel →</a></p>
      </div>
    `,
  })
}

export async function sendFoundingPartnerApproval({
  email,
  contactName,
  courseName,
  partnerNumber,
}: {
  email: string
  contactName: string
  courseName: string
  partnerNumber: number
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping founding partner email')
    return
  }

  const firstName = contactName.split(' ')[0]

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: email,
    subject: `Welcome, Founding Partner #${partnerNumber} of 10 — ${courseName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Welcome, Founding Partner #${partnerNumber} of 10 ⛳</h2>
        <p>Hey ${firstName},</p>
        <p><strong>${courseName}</strong> is officially a MulliganLinks Founding Partner.
        You're locked in free for life — no catches.</p>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600; color: #166534;">Your Founding Partner agreement (short version):</p>
          <ol style="color: #166534; padding-left: 20px; line-height: 2; margin: 8px 0 0;">
            <li>Promote the MulliganLinks membership to your golfers at booking.</li>
            <li>Allow us to feature ${courseName} in our marketing materials.</li>
          </ol>
        </div>
        <p><strong>What happens next:</strong></p>
        <ol style="color: #6B7770; padding-left: 20px; line-height: 2;">
          <li>Neil will reach out within 24 hours to schedule your onboarding call.</li>
          <li>We connect your tee sheet (we handle all the tech).</li>
          <li>You go live — your golfers start earning Fairway Points immediately.</li>
        </ol>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          MulliganLinks · Your home course, redone right.<br />
          Questions? Reply to this email directly.
        </p>
      </div>
    `,
  })
}
