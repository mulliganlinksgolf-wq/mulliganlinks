import { NextResponse } from 'next/server'
import { syncAllMailboxes } from '@/lib/crm/imap-sync'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const results = await syncAllMailboxes()
  const totalLogged = Object.values(results).reduce((s, r) => s + r.logged, 0)
  return NextResponse.json({ ok: true, results, totalLogged })
}
