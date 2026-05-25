'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { generateAndDeliverMonthlyBarterReceipt } from '@/lib/reports/monthlyBarterDelivery'

export interface GenerateNowResult {
  ok: boolean
  reason?: string
  emailed?: boolean
}

export async function generateBarterReceiptNow(opts: {
  slug: string
  receiptMonth: string // 'YYYY-MM-DD' first day of target month
  sendEmail?: boolean
}): Promise<GenerateNowResult> {
  const ctx = await requireManager(opts.slug)

  // Parse the month start. The client sends 'YYYY-MM-DD'; treat as UTC.
  const [y, m, d] = opts.receiptMonth.split('-').map(Number)
  if (!y || !m || !d) return { ok: false, reason: 'invalid_month' }
  const monthStart = new Date(Date.UTC(y, m - 1, d))

  const result = await generateAndDeliverMonthlyBarterReceipt({
    courseId: ctx.courseId,
    monthStart,
    generatedBy: 'manual',
    sendEmail: opts.sendEmail ?? false, // manual generation defaults to no-email so demos don't spam
  })

  revalidatePath(`/course/${opts.slug}/reports/barter-receipts`)

  if (result.ok) {
    return { ok: true, emailed: result.emailed }
  }
  return { ok: false, reason: result.reason }
}

export async function getReceiptDownloadUrl(opts: {
  slug: string
  receiptId: string
}): Promise<{ url?: string; error?: string }> {
  await requireManager(opts.slug)
  const admin = createAdminClient()

  const { data: receipt, error } = await admin
    .from('barter_receipts')
    .select('id, pdf_storage_path, course_id')
    .eq('id', opts.receiptId)
    .maybeSingle()
  if (error || !receipt) return { error: 'not_found' }
  if (!receipt.pdf_storage_path) return { error: 'no_pdf' }

  const { data: signed, error: signErr } = await admin.storage
    .from('reports')
    .createSignedUrl(receipt.pdf_storage_path, 60 * 60) // 1 hour

  if (signErr || !signed) return { error: signErr?.message ?? 'sign_failed' }
  return { url: signed.signedUrl }
}
