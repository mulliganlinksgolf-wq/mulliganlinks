import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a', lineHeight: 1.6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  brandSub: { fontSize: 9, color: '#6B7280' },
  headerRight: { alignItems: 'flex-end' },
  docTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headerMeta: { fontSize: 9, color: '#6B7280' },
  toBlock: { marginBottom: 24 },
  toLabel: { fontSize: 10, color: '#6B7280', marginBottom: 2 },
  toName: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  toDetail: { fontSize: 10, color: '#4B5563' },
  subjectLine: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 24 },
  body: { fontSize: 10.5, lineHeight: 1.7, marginBottom: 14 },
  bold: { fontFamily: 'Helvetica-Bold' },
  summaryBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 14, marginBottom: 24 },
  summaryTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#991B1B', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', marginBottom: 4 },
  summaryLabel: { width: 160, fontSize: 10, color: '#6B7280', fontFamily: 'Helvetica-Bold' },
  summaryValue: { flex: 1, fontSize: 10 },
  closingPara: { fontSize: 10.5, lineHeight: 1.7, marginBottom: 32 },
  sigClosing: { fontSize: 10.5, marginBottom: 32 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a', width: 200, marginBottom: 4, marginTop: 4 },
  sigName: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  sigTitle: { fontSize: 9.5, color: '#6B7280' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

interface Props {
  course: CrmCourse
  noticeDateStr: string
  lastDayStr: string
  refundAmount: number
  generatedAt: string
}

export function TerminationLetterPDF({ course, noticeDateStr, lastDayStr, refundAmount, generatedAt }: Props) {
  const generatedDateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const location = [course.city, course.state].filter(Boolean).join(', ')

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        <View style={S.headerRow}>
          <View>
            <Text style={S.brand}>TeeAhead</Text>
            <Text style={S.brandSub}>teeahead.com</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.docTitle}>Notice of Partnership Termination</Text>
            <Text style={S.headerMeta}>Date: {generatedDateStr}</Text>
          </View>
        </View>

        <View style={S.toBlock}>
          <Text style={S.toLabel}>TO:</Text>
          <Text style={S.toName}>{course.contact_name ?? 'Course Management'}</Text>
          <Text style={S.toDetail}>{course.name}</Text>
          {location ? <Text style={S.toDetail}>{location}</Text> : null}
          {course.contact_email ? <Text style={S.toDetail}>{course.contact_email}</Text> : null}
        </View>

        <Text style={S.subjectLine}>RE: Notice of Partnership Termination — {course.name}</Text>

        <Text style={S.body}>
          This letter serves as formal written notice that the Founding Partner Agreement between TeeAhead, LLC ("TeeAhead") and <Text style={S.bold}>{course.name}</Text> ("Partner Course") is being terminated in accordance with the terms of the Agreement.
        </Text>

        <Text style={S.body}>
          Per Section 6 of the Founding Partner Agreement, this notice is provided with thirty (30) days advance written notice. The effective date of termination is <Text style={S.bold}>{lastDayStr}</Text>, at which point the Partner Course will be removed from the TeeAhead platform and all member benefits will cease.
        </Text>

        <View style={S.summaryBox} wrap={false}>
          <Text style={S.summaryTitle}>Termination Summary</Text>
          <View style={S.summaryRow}><Text style={S.summaryLabel}>Notice Date:</Text><Text style={S.summaryValue}>{noticeDateStr}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryLabel}>Last Day of Listing:</Text><Text style={S.summaryValue}>{lastDayStr}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryLabel}>Platform Removal:</Text><Text style={S.summaryValue}>Within 5 business days of last day</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryLabel}>Pro-Rata Refund:</Text><Text style={S.summaryValue}>{refundAmount > 0 ? `$${refundAmount.toLocaleString()} USD` : 'None due'}</Text></View>
        </View>

        <Text style={S.body}>
          TeeAhead will process the removal of {course.name} from the platform within five (5) business days of the termination date.{refundAmount > 0 ? ` A pro-rata refund of $${refundAmount.toLocaleString()} USD for prepaid unused months will be issued within fourteen (14) days.` : ' No refund is due under the terms of the Agreement.'}
        </Text>

        <Text style={S.closingPara}>
          We appreciate the partnership and the opportunity to work together. If you have questions about this notice or the offboarding process, please contact Neil Barris at nbarris11@gmail.com.
        </Text>

        <Text style={S.sigClosing}>Sincerely,</Text>
        <View style={S.sigLine} />
        <Text style={S.sigName}>Neil Barris</Text>
        <Text style={S.sigTitle}>Co-Founder, TeeAhead, LLC</Text>
        <Text style={S.sigTitle}>nbarris11@gmail.com · teeahead.com</Text>

        <View style={S.footer}>
          <Text style={S.footerText}>TeeAhead, LLC · teeahead.com</Text>
          <Text style={S.footerText}>Confidential · {generatedDateStr}</Text>
        </View>
      </Page>
    </Document>
  )
}
