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
    from: 'TeeAhead <notifications@teeahead.com>',
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
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: 'Welcome to TeeAhead — confirm your email to get started',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Welcome to TeeAhead ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>You're in. TeeAhead is the local-first golf membership built for golfers
        who actually play — at their home course, with their regular group, without
        paying extra for the privilege.</p>

        <p>Once you confirm your email, here's what you get on the Fairway (free) tier:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>Book tee times at partner courses with zero booking fees</li>
          <li>Earn 1× Fairway Points on every dollar played</li>
          <li>Free cancellation up to 1 hour out — always</li>
        </ul>

        <p>Ready to earn more? Upgrade to Eagle ($89/yr) for 2× points, priority booking,
        and no booking fees. Or go Ace ($159/yr) for 3× points, 72hr early
        access, and 2 complimentary rounds/yr.</p>

        <p style="margin: 24px 0;">
          <a href="https://teeahead.com/app"
             style="background: #1B4332; color: #FAF7F2; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Go to my dashboard →
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
          Questions? Reply to this email or reach us at support@teeahead.com
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
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: `You're #${position} on the TeeAhead waitlist ⛳`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">You're #${position} on the list ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>You're officially on the TeeAhead waitlist. We're launching in Metro Detroit and you'll be
        among the first to know when we go live.</p>
        <p>Here's what you're waiting for:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>Zero booking fees at partner courses — forever</li>
          <li>Eagle membership ($89/yr) beats GolfPass+ ($119/yr) on every single metric</li>
          <li>Real Fairway Points on every dollar played at local courses</li>
        </ul>
        <p>Know a golf course that should partner with us? Send them to
        <a href="https://teeahead.com/waitlist/course" style="color: #1B4332;">teeahead.com/waitlist/course</a>.
        More partner courses = more value for you on day one.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
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
    from: 'TeeAhead <notifications@teeahead.com>',
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
          <li>The full TeeAhead platform — free for your first year</li>
          <li>Direct tee sheet connection (we handle the tech)</li>
          <li>Featured placement in our marketing to Metro Detroit golfers</li>
        </ul>
        <p>The only ask: tell your golfers about the TeeAhead membership at booking.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
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
    from: 'TeeAhead <notifications@teeahead.com>',
    to: ['neil@teeahead.com', 'billy@teeahead.com'],
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
        <p><a href="https://teeahead.com/admin/waitlist" style="color: #1B4332;">Review and approve in admin panel →</a></p>
      </div>
    `,
  })
}

export async function sendBarterReceipt({
  email,
  contactName,
  courseName,
  partnerNumber,
  estimatedAnnualBarterCost,
  approvedAt,
}: {
  email: string
  contactName: string
  courseName: string
  partnerNumber: number
  estimatedAnnualBarterCost: number
  approvedAt: Date
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping barter receipt')
    return
  }

  const firstName = contactName.split(' ')[0]
  const now = new Date()
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44
  const monthsSince = Math.max(0, Math.floor((now.getTime() - approvedAt.getTime()) / msPerMonth))
  const monthlyValue = Math.round(estimatedAnnualBarterCost / 12)
  const cumulativeSaved = monthlyValue * monthsSince

  const approvedMonth = approvedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const nowMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: `Your TeeAhead Barter Receipt — ${nowMonth}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Your TeeAhead Barter Receipt ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>Here's what <strong>${courseName}</strong> has avoided in GolfNow barter costs since joining
        as Founding Partner #${partnerNumber} in ${approvedMonth}.</p>

        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #166534;">Estimated annual GolfNow barter cost</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #166534;">$${estimatedAnnualBarterCost.toLocaleString()}/yr</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #166534;">Monthly barter value avoided</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #166534;">$${monthlyValue.toLocaleString()}/mo</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #166534;">Months as a Founding Partner</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #166534;">${monthsSince}</td>
            </tr>
            <tr style="border-top: 1px solid #BBF7D0;">
              <td style="padding: 10px 0 6px; font-weight: 700; font-size: 16px; color: #166534;">Cumulative barter saved</td>
              <td style="padding: 10px 0 6px; text-align: right; font-weight: 700; font-size: 18px; color: #166534;">$${cumulativeSaved.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #6B7770;">
          Estimate based on 2 barter tee times per day × 300 operating days × your average green fee,
          which is what GolfNow's standard barter agreement costs partner courses annually.
          TeeAhead charges you $0 — for your first year.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
          Questions? Reply to this email.
        </p>
      </div>
    `,
  })
}

export async function sendBroadcast({
  subject,
  html,
  recipients,
}: {
  subject: string
  html: string
  recipients: { email: string; name: string | null }[]
}): Promise<{ sent: number; error?: string }> {
  const client = getResend()
  if (!client) {
    console.log('[broadcast] Resend not configured — skipping:', subject)
    return { sent: 0, error: 'Resend not configured.' }
  }
  await Promise.all(
    recipients.map(r =>
      client.emails.send({
        from: 'TeeAhead <notifications@teeahead.com>',
        to: r.email,
        subject,
        html,
      })
    )
  )
  return { sent: recipients.length }
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
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: `Welcome, Founding Partner #${partnerNumber} of 10 — ${courseName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Welcome, Founding Partner #${partnerNumber} of 10 ⛳</h2>
        <p>Hey ${firstName},</p>
        <p><strong>${courseName}</strong> is officially a TeeAhead Founding Partner.
        You're locked in free for your first year — no catches.</p>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600; color: #166534;">Your Founding Partner agreement (short version):</p>
          <ol style="color: #166534; padding-left: 20px; line-height: 2; margin: 8px 0 0;">
            <li>Promote the TeeAhead membership to your golfers at booking.</li>
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
          TeeAhead · Your home course, redone right.<br />
          Questions? Reply to this email directly.
        </p>
      </div>
    `,
  })
}
