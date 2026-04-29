import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { getPnlByMonth } from '@/lib/reports/financial'
import PnlPdf from '@/app/admin/reports/financial/PnlPdf'
import { createElement } from 'react'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return new NextResponse('Forbidden', { status: 403 })

  const sp = req.nextUrl.searchParams
  const range = resolveDateRange(
    sp.get('preset') ?? undefined,
    sp.get('from') ?? undefined,
    sp.get('to') ?? undefined,
  )

  try {
    const rows = await getPnlByMonth(range.from, range.to)
    const generatedAt = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const buffer = await renderToBuffer(
      createElement(PnlPdf, { rows, generatedAt }) as unknown as ReactElement<DocumentProps>
    )
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="teeahead-pnl-${range.from}-${range.to}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[pnl-pdf] error:', err)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}
