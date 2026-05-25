import { NextResponse } from 'next/server'
import { sendPairingNotificationsForTomorrow } from '@/lib/pairing-notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await sendPairingNotificationsForTomorrow()
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    console.error('[cron/pairing-notifications] error:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
