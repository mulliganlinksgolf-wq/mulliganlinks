import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmOuting } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  banner: { backgroundColor: '#1B4332', color: 'white', padding: 16, borderRadius: 6, marginBottom: 28 },
  bannerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 2 },
  bannerSub: { fontSize: 10, color: '#A7C4B5' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332' },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 160, fontFamily: 'Helvetica-Bold', color: '#6B7770' },
  value: { flex: 1 },
  bullet: { flexDirection: 'row', marginBottom: 5 },
  bulletDot: { width: 14, color: '#E0A800', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1 },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props { outing: CrmOuting }

export function OutingConfirmationPDF({ outing }: Props) {
  const eventDateFormatted = outing.event_date
    ? new Date(outing.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.brandName}>TeeAhead</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Your Outing is Confirmed!</Text>
          <Text style={styles.bannerSub}>We look forward to seeing you on the course.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Organizer:</Text><Text style={styles.value}>{outing.contact_name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Event Date:</Text><Text style={styles.value}>{eventDateFormatted}</Text></View>
          {outing.preferred_course && <View style={styles.row}><Text style={styles.label}>Course:</Text><Text style={styles.value}>{outing.preferred_course}</Text></View>}
          {outing.num_golfers != null && <View style={styles.row}><Text style={styles.label}>Golfers:</Text><Text style={styles.value}>{outing.num_golfers}</Text></View>}
          {outing.budget_estimate != null && <View style={styles.row}><Text style={styles.label}>Total Amount:</Text><Text style={styles.value}>${outing.budget_estimate.toLocaleString()}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          {[
            'Confirm final headcount 7 days before the event',
            'Remaining balance due at event check-in',
            'Any special requests should be submitted 48 hours prior',
            'Contact your TeeAhead rep for any questions or changes',
          ].map((step, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>{i + 1}.</Text>
              <Text style={styles.bulletText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · Questions? hello@teeahead.com</Text>
      </Page>
    </Document>
  )
}
