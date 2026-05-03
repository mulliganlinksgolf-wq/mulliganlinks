import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const [{ data: adminRow }, { data: crmRow }] = await Promise.all([
      admin.from('course_admins').select('course_id').eq('user_id', user.id).limit(1).single(),
      admin.from('crm_course_users').select('course_id').eq('user_id', user.id).limit(1).single(),
    ])
    if (!adminRow && !crmRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? 'open'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

    const { data, error } = await supabase
      .from('service_requests')
      .select('id, golfer_id, category, note, estimated_hole, created_at, status, acknowledged_at, profiles!golfer_id(full_name)')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[service-requests/list]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const rows = (data ?? []).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id: row.id,
        golfer_name: profile?.full_name ?? null,
        category: row.category,
        note: row.note,
        estimated_hole: row.estimated_hole,
        created_at: row.created_at,
        status: row.status,
        acknowledged_at: row.acknowledged_at,
      }
    })

    return NextResponse.json(rows)
  } catch (err) {
    console.error('[service-requests/list]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
