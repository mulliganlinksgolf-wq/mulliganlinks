import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshOperatingDays } from '@/lib/operating-days'

export const maxDuration = 300

async function handler(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const { data: courses, error } = await admin
    .from('courses')
    .select('id, slug, sunrise_automation_enabled, latitude, longitude')
    .eq('status', 'active')
    .eq('sunrise_automation_enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type ResultRow = { slug: string; updated: number; skipped: number; error?: string }
  const results: ResultRow[] = []
  for (const c of courses ?? []) {
    if (c.latitude == null || c.longitude == null) {
      results.push({ slug: c.slug, updated: 0, skipped: 0, error: 'missing latitude/longitude' })
      continue
    }
    try {
      const r = await refreshOperatingDays({ courseId: c.id })
      results.push({ slug: c.slug, ...r })
    } catch (e) {
      results.push({
        slug: c.slug,
        updated: 0,
        skipped: 0,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return NextResponse.json({ ok: true, results })
}

export { handler as GET, handler as POST }
