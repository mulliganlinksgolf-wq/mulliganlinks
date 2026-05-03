import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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

    const { data, error } = await supabase
      .from('service_requests')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      })
      .eq('id', id)
      .eq('status', 'open')
      .select('id, status, acknowledged_at')
      .maybeSingle()

    if (error) {
      console.error('[service-requests/acknowledge]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Idempotent: if no rows were updated (already acknowledged, not found, or no RLS access)
    if (!data) {
      const { data: existing, error: fetchError } = await supabase
        .from('service_requests')
        .select('id, status, acknowledged_at')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) {
        console.error('[service-requests/acknowledge]', fetchError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }

      if (!existing) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json(existing)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[service-requests/acknowledge]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
