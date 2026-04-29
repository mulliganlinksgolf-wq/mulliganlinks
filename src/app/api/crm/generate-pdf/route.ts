import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { FoundingPartnerAgreementPDF } from '@/lib/crm/pdf-templates/FoundingPartnerAgreement'
import { CourseProposalPDF } from '@/lib/crm/pdf-templates/CourseProposal'
import { BenefitsSchedulePDF } from '@/lib/crm/pdf-templates/BenefitsSchedule'
import { OnboardingPacketPDF } from '@/lib/crm/pdf-templates/OnboardingPacket'
import { TerminationLetterPDF } from '@/lib/crm/pdf-templates/TerminationLetter'
import { MembershipCardPDF } from '@/lib/crm/pdf-templates/MembershipCard'
import { OutingInvoicePDF } from '@/lib/crm/pdf-templates/OutingInvoice'
import { OutingQuotePDF } from '@/lib/crm/pdf-templates/OutingQuote'
import { OutingConfirmationPDF } from '@/lib/crm/pdf-templates/OutingConfirmation'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) return null
  return { admin, user }
}

export async function POST(req: NextRequest) {
  const auth = await assertAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin } = auth

  const body = await req.json() as {
    template: string
    recordType: 'course' | 'outing' | 'member'
    recordId: string
    createdBy: string
    options?: {
      contractYears?: number
      monthlyFee?: number
      eagleRate?: string
      aceRate?: string
      priorityHours?: string
      eagleCredits?: string
      aceCredits?: string
      noticeDate?: string
      lastDay?: string
      refundAmount?: number
      dueDate?: string
      depositPaid?: number
    }
  }

  if (!['course', 'outing', 'member'].includes(body.recordType)) {
    return NextResponse.json({ error: 'Invalid record type' }, { status: 400 })
  }

  const table = body.recordType === 'course' ? 'crm_courses' : body.recordType === 'outing' ? 'crm_outings' : 'crm_members'
  const { data: record, error: recordError } = await admin.from(table).select('*').eq('id', body.recordId).single()
  if (recordError || !record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let element: any
  let docName: string

  switch (body.template) {
    case 'founding-partner-agreement':
      element = createElement(FoundingPartnerAgreementPDF, {
        course: record, generatedAt: now,
        contractYears: body.options?.contractYears ?? 1,
        monthlyFee: body.options?.monthlyFee ?? 349,
      })
      docName = `Founding Partner Agreement — ${record.name}`
      break
    case 'course-proposal':
      element = createElement(CourseProposalPDF, { course: record })
      docName = `Course Proposal — ${record.name}`
      break
    case 'benefits-schedule':
      element = createElement(BenefitsSchedulePDF, {
        course: record, generatedAt: now,
        eagleRate: body.options?.eagleRate ?? '',
        aceRate: body.options?.aceRate ?? '',
        priorityHours: body.options?.priorityHours ?? 'Off-peak only',
        eagleCredits: body.options?.eagleCredits ?? '',
        aceCredits: body.options?.aceCredits ?? '',
      })
      docName = `Benefits Schedule — ${record.name}`
      break
    case 'onboarding-packet':
      element = createElement(OnboardingPacketPDF, { course: record, generatedAt: now })
      docName = `Onboarding Packet — ${record.name}`
      break
    case 'termination-letter':
      element = createElement(TerminationLetterPDF, {
        course: record, generatedAt: now,
        noticeDateStr: body.options?.noticeDate
          ? new Date(body.options.noticeDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        lastDayStr: body.options?.lastDay
          ? new Date(body.options.lastDay + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date(Date.now() + 30 * 864e5).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        refundAmount: body.options?.refundAmount ?? 0,
      })
      docName = `Termination Letter — ${record.name}`
      break
    case 'membership-card':
      element = createElement(MembershipCardPDF, { member: record, generatedAt: now })
      docName = `Membership Card — ${record.name}`
      break
    case 'outing-invoice': {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${record.id.slice(0, 6).toUpperCase()}`
      element = createElement(OutingInvoicePDF, {
        outing: record, generatedAt: now,
        invoiceNumber,
        dueDate: body.options?.dueDate ?? new Date(Date.now() + 14 * 864e5).toISOString().split('T')[0],
        depositPaid: body.options?.depositPaid ?? 0,
      })
      docName = `Invoice — ${record.contact_name}`
      break
    }
    case 'outing-quote':
      element = createElement(OutingQuotePDF, { outing: record })
      docName = `Outing Quote — ${record.contact_name}`
      break
    case 'outing-confirmation':
      element = createElement(OutingConfirmationPDF, { outing: record })
      docName = `Outing Confirmation — ${record.contact_name}`
      break
    default:
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  }

  const pdfBuffer = await renderToBuffer(element)

  const filename = `${body.recordType}/${body.recordId}/${Date.now()}-${body.template}.pdf`
  const { error: uploadError } = await admin.storage
    .from('crm-documents')
    .upload(filename, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from('crm-documents').getPublicUrl(filename)
  const fileUrl = urlData.publicUrl

  const docType = ['founding-partner-agreement', 'termination-letter'].includes(body.template) ? 'contract'
    : ['course-proposal', 'onboarding-packet', 'benefits-schedule'].includes(body.template) ? 'proposal'
    : 'other'

  const { data: doc, error: docError } = await admin.from('crm_documents').insert({
    record_type: body.recordType,
    record_id: body.recordId,
    name: docName,
    type: docType,
    file_url: fileUrl,
    created_by: body.createdBy,
  }).select('id, file_url').single()

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, documentId: doc.id, fileUrl: doc.file_url })
}
