import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidCategory } from '@/lib/serviceRequestCategories'
import { estimateHole } from '@/lib/estimateHole'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { course_id, category, note, booking_id } = body

    if (!course_id) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
    }

    if (!category || !isValidCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    let estimated_hole: number | null = null

    if (booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('tee_time_id')
        .eq('id', booking_id)
        .single()

      if (booking?.tee_time_id) {
        const { data: teeTime } = await supabase
          .from('tee_times')
          .select('scheduled_at')
          .eq('id', booking.tee_time_id)
          .single()

        if (teeTime?.scheduled_at) {
          estimated_hole = estimateHole(new Date(teeTime.scheduled_at), new Date())
        }
      }
    }

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        course_id,
        golfer_id: user.id,
        booking_id: booking_id ?? null,
        category,
        note: note ?? null,
        estimated_hole,
        status: 'open',
      })
      .select('id, created_at, category, estimated_hole, status')
      .single()

    if (error) {
      console.error('[service-requests]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[service-requests]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
