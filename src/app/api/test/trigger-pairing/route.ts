import { NextResponse } from 'next/server'
import { sendPairingNotificationsForTomorrow } from '@/lib/pairing-notifications'

export const dynamic = 'force-dynamic'

// Test-only route. Refuses to run in production.
// Useful for manual QA and E2E test triggering of the pairing-notification job.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 })
  }
  if (request.headers.get('x-test-key') !== process.env.TEST_API_KEY) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const result = await sendPairingNotificationsForTomorrow()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e instanceof Error ? e.message : String(e)) ?? 'unknown' }, { status: 500 })
  }
}
