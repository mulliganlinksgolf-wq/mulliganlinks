import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmOuting } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, borderBottomWidth: 1.5, borderBottomStyle: 'solid', borderBottomColor: '#1B4332', paddingBottom: 12 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  brandSub: { fontSize: 9, color: '#6B7280' },
  headerRight: { alignItems: 'flex-end' },
  invoiceLabel: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  invoiceMeta: { fontSize: 9.5, color: '#6B7280', marginBottom: 1 },
  infoRow: { flexDirection: 'row', marginBottom: 28 },
  infoBlock: { flex: 1 },
  infoTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6B7280', marginBottom: 5 },
  infoName: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 2 },
  infoDetail: { fontSize: 10, color: '#4B5563', marginBottom: 1 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 8, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  lineRow: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#F3F4F6' },
  lineDesc: { flex: 1, fontSize: 10.5 },
  lineAmt: { width: 120, textAlign: 'right', fontSize: 10.5 },
  creditRow: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#F3F4F6' },
  creditDesc: { flex: 1, fontSize: 10.5, color: '#059669' },
  creditAmt: { width: 120, textAlign: 'right', fontSize: 10.5, color: '#059669' },
  totalBox: { backgroundColor: '#1B4332', padding: 14, flexDirection: 'row', marginBottom: 24 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#FFFFFF' },
  totalAmt: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#FFFFFF' },
  dueBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderStyle: 'solid', borderColor: '#FECACA', padding: 12, marginBottom: 24 },
  dueText: { fontSize: 10.5, color: '#991B1B', fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  payText: { fontSize: 10, lineHeight: 1.6, color: '#374151' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props {
  outing: CrmOuting
  invoiceNumber: string
  dueDate: string
  depositPaid: number
  generatedAt: string
}

export function OutingInvoicePDF({ outing, invoiceNumber, dueDate, depositPaid, generatedAt }: Props) {
  const generatedDateStr = generatedAt
    ? new Date(generatedAt.includes('T') ? generatedAt : generatedAt + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const dueDateStr = dueDate
    ? new Date(dueDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const eventDateStr = outing.event_date
    ? new Date(outing.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'
  const total = outing.budget_estimate ?? 0
  const balance = Math.max(0, total - depositPaid)

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        <View style={S.headerRow}>
          <View>
            <Text style={S.brand}>TeeAhead</Text>
            <Text style={S.brandSub}>teeahead.com</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.invoiceLabel}>INVOICE</Text>
            <Text style={S.invoiceMeta}>Invoice No.: {invoiceNumber}</Text>
            <Text style={S.invoiceMeta}>Invoice Date: {generatedDateStr}</Text>
            <Text style={S.invoiceMeta}>Due Date: {dueDateStr}</Text>
          </View>
        </View>

        <View style={S.infoRow}>
          <View style={S.infoBlock}>
            <Text style={S.infoTitle}>FROM</Text>
            <Text style={S.infoName}>TeeAhead, LLC</Text>
            <Text style={S.infoDetail}>Metro Detroit, Michigan</Text>
            <Text style={S.infoDetail}>teeahead.com</Text>
            <Text style={S.infoDetail}>nbarris11@gmail.com</Text>
          </View>
          <View style={S.infoBlock}>
            <Text style={S.infoTitle}>BILL TO</Text>
            <Text style={S.infoName}>{outing.contact_name}</Text>
            {outing.contact_email ? <Text style={S.infoDetail}>{outing.contact_email}</Text> : null}
            {outing.contact_phone ? <Text style={S.infoDetail}>{outing.contact_phone}</Text> : null}
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Event Details</Text>
          <View style={S.lineRow}><Text style={S.lineDesc}>Event Date</Text><Text style={S.lineAmt}>{eventDateStr}</Text></View>
          {outing.preferred_course ? <View style={S.lineRow}><Text style={S.lineDesc}>Course</Text><Text style={S.lineAmt}>{outing.preferred_course}</Text></View> : null}
          {outing.num_golfers != null ? <View style={S.lineRow}><Text style={S.lineDesc}>Golfers</Text><Text style={S.lineAmt}>{outing.num_golfers}</Text></View> : null}
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Charges</Text>
          <View style={S.lineRow}>
            <Text style={S.lineDesc}>Golf Outing{outing.num_golfers ? ` — ${outing.num_golfers} golfers` : ''}</Text>
            <Text style={S.lineAmt}>{total > 0 ? `$${total.toLocaleString()}` : 'TBD'}</Text>
          </View>
          {depositPaid > 0 ? (
            <View style={S.creditRow}>
              <Text style={S.creditDesc}>Deposit Previously Paid</Text>
              <Text style={S.creditAmt}>-${depositPaid.toLocaleString()}</Text>
            </View>
          ) : null}
          <View style={S.totalBox}>
            <Text style={S.totalLabel}>Balance Due</Text>
            <Text style={S.totalAmt}>{balance > 0 ? `$${balance.toLocaleString()}` : '$0'}</Text>
          </View>
        </View>

        {balance > 0 ? (
          <View style={S.dueBox}>
            <Text style={S.dueText}>Payment due by {dueDateStr}</Text>
          </View>
        ) : null}

        <View style={S.section}>
          <Text style={S.sectionTitle}>Payment</Text>
          <Text style={S.payText}>
            To submit payment, contact Neil Barris at nbarris11@gmail.com or reply to this invoice. We accept check, ACH, Venmo, and Zelle. Please reference invoice number {invoiceNumber} with your payment.
          </Text>
        </View>

        <Text style={S.footer}>TeeAhead, LLC · teeahead.com · Thank you for booking with TeeAhead!</Text>
      </Page>
    </Document>
  )
}
