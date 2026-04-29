// src/app/api/reports/course/barter-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory } from '@/lib/reports/courseMetrics'
import BarterPdf from '@/components/reports/pdf/BarterPdf'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return new NextResponse('Missing slug', { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin.from('courses').select('id, name, slug').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[barter-pdf] course query failed: ${courseError.message}`)
  if (!course) return new NextResponse('Course not found', { status: 404 })

  // Verify user has access to this course
  const [{ data: profile }, { data: courseAdmin }, { data: courseUser }] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
    admin.from('course_admins').select('id').eq('user_id', user.id).eq('course_id', course.id).maybeSingle(),
    admin.from('crm_course_users').select('id').eq('user_id', user.id).eq('course_id', course.id).maybeSingle(),
  ])
  if (!profile?.is_admin && !courseAdmin && !courseUser) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const history = await getCourseMetricHistory(course.id, 12)
  const latest = history[history.length - 1]
  const monthsElapsed = new Date().getMonth() + 1
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const buffer = await renderToBuffer(
    createElement(BarterPdf, {
      courseName: course.name,
      month: monthLabel,
      roundsMtd: latest?.rounds_booked ?? 0,
      avgGreenFee: Number(latest?.avg_green_fee ?? 0),
      revenueMtd: Number(latest?.green_fee_revenue ?? 0),
      waitlistFills: latest?.waitlist_fills ?? 0,
      membersMtd: latest?.members_attributed ?? 0,
      monthsElapsed,
    }) as unknown as ReactElement<DocumentProps>
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="teeahead-${slug}-${new Date().toISOString().slice(0, 7)}.pdf"`,
    },
  })
}
