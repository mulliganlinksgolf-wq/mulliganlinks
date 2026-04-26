import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com']

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val).replace(/"/g, '""')
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'golfers'
  const adminClient = createAdminClient()

  let csv = ''
  let filename = ''

  if (type === 'courses') {
    const { data } = await adminClient
      .from('course_waitlist')
      .select('*')
      .order('created_at', { ascending: false })
    csv = toCSV((data ?? []) as Record<string, unknown>[])
    filename = 'mulligan-course-waitlist.csv'
  } else {
    const { data } = await adminClient
      .from('golfer_waitlist')
      .select('*')
      .order('id', { ascending: true })
    csv = toCSV((data ?? []) as Record<string, unknown>[])
    filename = 'mulligan-golfer-waitlist.csv'
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
