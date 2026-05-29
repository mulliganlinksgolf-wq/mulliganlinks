// Monthly cron: on the 1st of each month, generate and email a Barter
// Receipt for every active partner course covering the previous month.
//
// Schedule: vercel.json, "0 13 1 * *" (13:00 UTC = 8am ET in winter,
// 9am ET in summer). Vercel sends a GET request with the CRON_SECRET
// in the Authorization header.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndDeliverMonthlyBarterReceipt } from '@/lib/reports/monthlyBarterDelivery'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Last completed month in UTC. Vercel cron fires at 13:00 UTC on the
  // 1st, so "now" is always inside the new month, we want the month before.
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

  const admin = createAdminClient()
  const { data: courses, error } = await admin
    .from('courses')
    .select('id, slug, name')
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const results: Array<{ slug: string; ok: boolean; reason?: string; receiptId?: string; emailed?: boolean }> = []
  for (const c of courses ?? []) {
    try {
      const r = await generateAndDeliverMonthlyBarterReceipt({
        courseId: c.id,
        monthStart,
        generatedBy: 'cron',
      })
      if (r.ok) {
        results.push({ slug: c.slug, ok: true, receiptId: r.receiptId, emailed: r.emailed })
      } else {
        results.push({ slug: c.slug, ok: false, reason: r.reason })
      }
    } catch (err) {
      console.error(`[cron monthly-barter-receipts] ${c.slug} failed`, err)
      results.push({ slug: c.slug, ok: false, reason: 'exception' })
    }
  }

  return NextResponse.json({
    ok: true,
    monthStart: monthStart.toISOString().slice(0, 10),
    coursesProcessed: results.length,
    results,
  })
}
