import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { FoundingPartnerAgreementPDF } from '@/lib/crm/pdf-templates/FoundingPartnerAgreement'
import { CourseProposalPDF } from '@/lib/crm/pdf-templates/CourseProposal'
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
    recordType: 'course' | 'outing'
    recordId: string
    createdBy: string
    options?: {
      contractYears?: number
      monthlyFee?: number
    }
  }

  const table = body.recordType === 'course' ? 'crm_courses' : 'crm_outings'
  const { data: record, error: recordError } = await admin.from(table).select('*').eq('id', body.recordId).single()
  if (recordError || !record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let element: any
  let docName: string

  switch (body.template) {
    case 'founding-partner-agreement':
      element = createElement(FoundingPartnerAgreementPDF, {
        course: record,
        generatedAt: new Date().toISOString(),
        contractYears: body.options?.contractYears ?? 1,
        monthlyFee: body.options?.monthlyFee ?? 349,
      })
      docName = `Founding Partner Agreement — ${record.name}`
      break
    case 'course-proposal':
      element = createElement(CourseProposalPDF, { course: record })
      docName = `Course Proposal — ${record.name}`
      break
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

  const { data: doc, error: docError } = await admin.from('crm_documents').insert({
    record_type: body.recordType,
    record_id: body.recordId,
    name: docName,
    type: body.template.includes('agreement') || body.template.includes('confirmation') ? 'contract' : 'proposal',
    file_url: fileUrl,
    created_by: body.createdBy,
  }).select('id, file_url').single()

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, documentId: doc.id, fileUrl: doc.file_url })
}
