import { NextRequest, NextResponse } from 'next/server'
import { sendAdminNotification } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const lead = await req.json()
  const savings = Math.round(lead.calculatedSavings ?? 0).toLocaleString()

  await sendAdminNotification({
    subject: `New lead: ${lead.courseName || lead.name} — $${savings}/yr savings`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">New calculator lead</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Role:</strong> ${lead.role || '—'}</p>
        <p><strong>Course:</strong> ${lead.courseName || '—'}</p>
        <p><strong>Vendor:</strong> ${lead.vendor}</p>
        <p><strong>Calculated savings:</strong> $${savings}/yr</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
