// Orchestration for generating, archiving, and emailing the monthly
// NGCOA-methodology Barter Receipt. Used by:
//   - /api/cron/monthly-barter-receipts (cron, generatedBy = 'cron')
//   - the "Generate Now" manual action on /course/[slug]/reports/barter-receipts
//     (generatedBy = 'manual', useful for live demos with prospective Founding Partners)

import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateMonthlyBarterReceipt } from './barter'
import MonthlyBarterReceiptPdf from '@/components/reports/pdf/MonthlyBarterReceiptPdf'
import { sendMonthlyBarterReceipt } from '@/lib/resend'

export const STORAGE_BUCKET = 'reports'

export type DeliveryResult =
  | { ok: true; receiptId: string; storagePath: string; emailed: boolean }
  | { ok: false; reason: 'course_not_found' | 'no_bookings_in_month' | 'upload_failed' | 'insert_failed'; detail?: string }

export async function generateAndDeliverMonthlyBarterReceipt(opts: {
  courseId: string
  monthStart: Date // first day of reported month, 00:00 UTC
  generatedBy: 'cron' | 'manual'
  recipientOverride?: string // for ad-hoc test sends; otherwise uses course billing_email / email
  sendEmail?: boolean // default true for cron, callers may opt out
}): Promise<DeliveryResult> {
  const admin = createAdminClient()
  const sendEmail = opts.sendEmail ?? true

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, name, slug, email, billing_email')
    .eq('id', opts.courseId)
    .maybeSingle()
  if (courseErr) return { ok: false, reason: 'course_not_found', detail: courseErr.message }
  if (!course) return { ok: false, reason: 'course_not_found' }

  const calc = await calculateMonthlyBarterReceipt({
    courseId: opts.courseId,
    monthStart: opts.monthStart,
  })
  if (!calc) return { ok: false, reason: 'no_bookings_in_month' }

  const monthLabel = opts.monthStart.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const pdfBuffer = await renderToBuffer(
    createElement(MonthlyBarterReceiptPdf, {
      courseName: course.name,
      monthLabel,
      calc,
    }) as unknown as ReactElement<DocumentProps>
  )

  const storagePath = `barter-receipts/${calc.receiptMonth}/${course.id}.pdf`

  // Upload PDF (upsert so manual regeneration replaces the existing file).
  const { error: uploadErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErr) {
    return { ok: false, reason: 'upload_failed', detail: uploadErr.message }
  }

  // Insert (or replace) the archive row.
  const { data: receiptRow, error: insertErr } = await admin
    .from('barter_receipts')
    .upsert(
      {
        course_id: course.id,
        receipt_month: calc.receiptMonth,
        total_rounds: calc.totalRounds,
        peak_rounds: calc.peakRounds,
        peak_pct: calc.peakPct,
        avg_green_fee: calc.avgGreenFee,
        estimated_barter_rounds: calc.estimatedBarterRounds,
        estimated_barter_cost: calc.estimatedBarterCost,
        pdf_storage_path: storagePath,
        generated_by: opts.generatedBy,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'course_id,receipt_month' },
    )
    .select('id')
    .single()
  if (insertErr || !receiptRow) {
    return { ok: false, reason: 'insert_failed', detail: insertErr?.message }
  }

  let emailed = false
  if (sendEmail) {
    const recipient = opts.recipientOverride ?? course.billing_email ?? course.email ?? null
    if (recipient) {
      const { data: signed } = await admin.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30) // 30 days

      try {
        await sendMonthlyBarterReceipt({
          email: recipient,
          courseName: course.name,
          monthLabel,
          estimatedBarterCost: calc.estimatedBarterCost,
          pdfBuffer,
          pdfFilename: `teeahead-barter-receipt-${calc.receiptMonth}.pdf`,
          downloadUrl: signed?.signedUrl,
        })
        emailed = true
        await admin
          .from('barter_receipts')
          .update({ emailed_at: new Date().toISOString(), email_recipient: recipient })
          .eq('id', receiptRow.id)
      } catch (err) {
        console.error('[monthlyBarterDelivery] email failed', err)
        // Row + PDF are already persisted — the manager can re-trigger the
        // email from the archive page. Don't mark delivery as failed.
      }
    }
  }

  return { ok: true, receiptId: receiptRow.id, storagePath, emailed }
}
