import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmOuting } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  header: { marginBottom: 32 },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  date: { fontSize: 10, color: '#6B7770', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 160, fontFamily: 'Helvetica-Bold', color: '#6B7770' },
  value: { flex: 1 },
  totalRow: { flexDirection: 'row', backgroundColor: '#F0FDF4', padding: 10, borderRadius: 4, marginTop: 8 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1B4332' },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1B4332' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props { outing: CrmOuting }

export function OutingQuotePDF({ outing }: Props) {
  const eventDateFormatted = outing.event_date
    ? new Date(outing.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'

  const perPersonCost = outing.budget_estimate && outing.num_golfers
    ? (outing.budget_estimate / outing.num_golfers).toFixed(2)
    : null

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>TeeAhead</Text>
          <Text style={styles.docTitle}>Outing Quote</Text>
          <Text style={styles.date}>Prepared {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <View style={styles.row}><Text style={styles.label}>Organizer:</Text><Text style={styles.value}>{outing.contact_name}</Text></View>
          {outing.contact_email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{outing.contact_email}</Text></View>}
          {outing.contact_phone && <View style={styles.row}><Text style={styles.label}>Phone:</Text><Text style={styles.value}>{outing.contact_phone}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Event Date:</Text><Text style={styles.value}>{eventDateFormatted}</Text></View>
          {outing.preferred_course && <View style={styles.row}><Text style={styles.label}>Preferred Course:</Text><Text style={styles.value}>{outing.preferred_course}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          {outing.num_golfers != null && <View style={styles.row}><Text style={styles.label}>Number of Golfers:</Text><Text style={styles.value}>{outing.num_golfers}</Text></View>}
          {perPersonCost && <View style={styles.row}><Text style={styles.label}>Estimated Per Person:</Text><Text style={styles.value}>${perPersonCost}</Text></View>}
          {outing.budget_estimate != null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Estimate</Text>
              <Text style={styles.totalValue}>${outing.budget_estimate.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={{ lineHeight: 1.6 }}>
            To confirm your outing, please reply to this quote or contact your TeeAhead representative. A 50% deposit is due upon booking confirmation. Final headcount should be confirmed no later than 7 days before the event.
          </Text>
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · Questions? Email hello@teeahead.com</Text>
      </Page>
    </Document>
  )
}
