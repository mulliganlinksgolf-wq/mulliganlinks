import { NextRequest, NextResponse } from 'next/server'
import { sendAdminNotification } from '@/lib/resend'

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json()
    const savings = Math.round(lead.calculatedSavings ?? 0).toLocaleString()

    await sendAdminNotification({
      subject: `New lead: ${esc(lead.courseName || lead.name)} — $${savings}/yr savings`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1B4332;">New calculator lead</h2>
          <p><strong>Name:</strong> ${esc(lead.name)}</p>
          <p><strong>Email:</strong> ${esc(lead.email)}</p>
          <p><strong>Role:</strong> ${esc(lead.role) || '—'}</p>
          <p><strong>Course:</strong> ${esc(lead.courseName) || '—'}</p>
          <p><strong>Vendor:</strong> ${esc(lead.vendor)}</p>
          <p><strong>Calculated savings:</strong> $${savings}/yr</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lead]', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
