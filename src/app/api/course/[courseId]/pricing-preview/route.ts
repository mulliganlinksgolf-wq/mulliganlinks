import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { bulkResolveForDay } from '@/lib/pricing/resolver'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Granular permission gate: same gate as the rule editor.
  const allowed = await hasPermission(user.id, courseId, 'manage_course_settings')
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Resolve next 7 days using admin client (cache writes are service-role-only)
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() + i)
    await bulkResolveForDay({ courseId, date: d.toISOString().slice(0, 10) })
  }

  const startIso = new Date().toISOString()
  const endIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Read the cache via the admin client too — public RLS on tee_time_computed_rates
  // is enabled but the embedded select via tee_times needs both selectable in the
  // same RLS context. The admin client guarantees a consistent view.
  const adminClient = createAdminClient()
  const { data: rates } = await adminClient
    .from('tee_time_computed_rates')
    .select('tee_time_id, computed_rate, fired_rule_labels, tee_times!inner(scheduled_at)')
    .eq('course_id', courseId)
    .gte('tee_times.scheduled_at', startIso)
    .lte('tee_times.scheduled_at', endIso)

  type RateRow = {
    computed_rate: number | string
    fired_rule_labels: string[] | null
    tee_times: { scheduled_at: string }
  }

  const grid: Record<string, { rate: number; rules: string[] }> = {}
  for (const r of (rates ?? []) as unknown as RateRow[]) {
    const slot = new Date(r.tee_times.scheduled_at)
    slot.setUTCMinutes(0, 0, 0)
    const key = slot.toISOString().slice(0, 13) + ':00' // 'YYYY-MM-DDTHH:00'
    grid[key] = {
      rate: Number(r.computed_rate),
      rules: r.fired_rule_labels ?? [],
    }
  }

  return NextResponse.json(grid)
}
