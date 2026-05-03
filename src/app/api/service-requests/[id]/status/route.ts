import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Golfer-facing endpoint: poll whether their own request has been acknowledged
export async function GET(
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

    // RLS golfer_select ensures only the owning golfer can see this row
    const { data, error } = await supabase
      .from('service_requests')
      .select('id, status, acknowledged_at')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[service-requests/status]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[service-requests/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
