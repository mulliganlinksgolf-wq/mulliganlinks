import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  header: { marginBottom: 32 },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#6B7770' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, fontFamily: 'Helvetica-Bold', color: '#6B7770' },
  value: { flex: 1 },
  body: { lineHeight: 1.6, marginBottom: 8 },
  signatureBlock: { marginTop: 40, flexDirection: 'row', gap: 40 },
  signatureLine: { flex: 1, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 6 },
  signatureLabel: { fontSize: 9, color: '#6B7770' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props {
  course: CrmCourse
  generatedAt: string
}

export function FoundingPartnerAgreementPDF({ course, generatedAt }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>TeeAhead</Text>
          <Text style={styles.docTitle}>Founding Partner Agreement</Text>
          <Text style={styles.subtitle}>Generated {new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Information</Text>
          <View style={styles.row}><Text style={styles.label}>Course Name:</Text><Text style={styles.value}>{course.name}</Text></View>
          {course.city && <View style={styles.row}><Text style={styles.label}>Location:</Text><Text style={styles.value}>{[course.city, course.state].filter(Boolean).join(', ')}</Text></View>}
          {course.contact_name && <View style={styles.row}><Text style={styles.label}>Contact:</Text><Text style={styles.value}>{course.contact_name}</Text></View>}
          {course.contact_email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{course.contact_email}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Founding Partner Terms</Text>
          <Text style={styles.body}>
            This Founding Partner Agreement ("Agreement") is entered into between TeeAhead, LLC ("TeeAhead") and the course identified above ("Partner Course").
          </Text>
          <Text style={styles.body}>
            As a TeeAhead Founding Partner, the Partner Course agrees to: (1) Honor TeeAhead membership benefits for qualifying members at the rates described in the current benefit schedule; (2) Provide accurate tee time availability to the TeeAhead platform; (3) Collaborate on joint marketing initiatives to grow the local golf community.
          </Text>
          <Text style={styles.body}>
            TeeAhead agrees to: (1) List the Partner Course on the TeeAhead platform at no cost during the Founding Partner period; (2) Drive qualified member traffic and bookings to the Partner Course; (3) Provide monthly reports on member activity and bookings.
          </Text>
          <Text style={styles.body}>
            This agreement is valid for a period of twelve (12) months from the date of signing and may be renewed by mutual written consent.
          </Text>
        </View>

        <View style={[styles.signatureBlock, { marginTop: 48 }]}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Authorized Signature — {course.name}</Text>
            <Text style={{ marginTop: 32, color: '#9CA3AF', fontSize: 9 }}>Print name & title:</Text>
            <View style={{ marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }} />
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>Date:</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Authorized Signature — TeeAhead</Text>
            <Text style={{ marginTop: 32, color: '#9CA3AF', fontSize: 9 }}>Neil Barris, Co-Founder</Text>
            <View style={{ marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }} />
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>Date:</Text>
          </View>
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · Confidential</Text>
      </Page>
    </Document>
  )
}
