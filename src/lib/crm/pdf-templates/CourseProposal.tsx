import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  tagline: { fontSize: 11, color: '#6B7770', marginBottom: 32 },
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  addressee: { fontSize: 12, color: '#6B7770', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332' },
  bullet: { flexDirection: 'row', marginBottom: 6 },
  bulletDot: { width: 16, color: '#E0A800', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, lineHeight: 1.5 },
  highlight: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 4, marginTop: 16 },
  highlightText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1B4332', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props { course: CrmCourse }

export function CourseProposalPDF({ course }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.brandName}>TeeAhead</Text>
        <Text style={styles.tagline}>Detroit's Local Golf Loyalty Network</Text>
        <Text style={styles.docTitle}>Partnership Proposal</Text>
        <Text style={styles.addressee}>Prepared for: {course.contact_name ?? 'Golf Course Management'} at {course.name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is TeeAhead?</Text>
          <Text style={{ lineHeight: 1.6, marginBottom: 8 }}>
            TeeAhead is a local-first golf loyalty platform connecting metro Detroit golfers with their favorite courses. Members pay a monthly subscription and receive exclusive benefits — discounted rounds, tee time priority, and barter credits — at our network of partner courses.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Partner with TeeAhead?</Text>
          {[
            'Zero cost to your course — no upfront fees, no technology investment',
            'Drive incremental rounds from our growing member base',
            'Increase off-peak utilization with targeted member offers',
            'Data on member usage patterns to help optimize your tee sheet',
            'Co-marketing through TeeAhead digital channels and email list',
          ].map((point, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Founding Partner Benefits</Text>
          {[
            'Founding Partner badge on your TeeAhead listing — permanent recognition',
            'Priority placement in member search and recommendations',
            'Locked-in terms for the first 12 months — no surprise changes',
            'Direct line to TeeAhead founders for feedback and collaboration',
          ].map((point, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>No commitment required to get started.</Text>
          <Text style={{ textAlign: 'center', fontSize: 10, color: '#4B7C61', marginTop: 4 }}>
            Schedule a 20-minute demo and see the platform in action.
          </Text>
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · {new Date().getFullYear()}</Text>
      </Page>
    </Document>
  )
}
