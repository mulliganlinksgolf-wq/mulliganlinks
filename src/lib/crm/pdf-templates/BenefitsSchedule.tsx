import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 52, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, borderBottomWidth: 1.5, borderBottomColor: '#1B4332', paddingBottom: 10 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  brandSub: { fontSize: 9, color: '#6B7280' },
  headerRight: { alignItems: 'flex-end' },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headerMeta: { fontSize: 9, color: '#6B7280' },
  courseName: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#1B4332' },
  courseLocation: { fontSize: 10, color: '#6B7280', marginBottom: 16 },
  intro: { fontSize: 9.5, lineHeight: 1.6, marginBottom: 20, color: '#374151' },
  tiersRow: { flexDirection: 'row', marginBottom: 20 },
  tierBox: { flex: 1, borderWidth: 1.5, borderColor: '#1B4332', padding: 14 },
  tierSep: { width: 10 },
  tierBadge: { backgroundColor: '#1B4332', padding: 6, marginBottom: 10 },
  tierBadgeText: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center' },
  tierPrice: { fontSize: 10, color: '#059669', fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', marginBottom: 6 },
  benefitLabel: { width: 100, fontSize: 9, color: '#6B7280', fontFamily: 'Helvetica-Bold' },
  benefitValue: { flex: 1, fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#D1FAE5', paddingBottom: 3 },
  stepRow: { flexDirection: 'row', marginBottom: 5 },
  stepNum: { width: 16, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  stepText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
  noticeBox: { backgroundColor: '#FEF9C3', padding: 10, marginBottom: 16 },
  noticeText: { fontSize: 9.5, lineHeight: 1.5, color: '#78350F' },
  bold: { fontFamily: 'Helvetica-Bold' },
  contactRow: { flexDirection: 'row', marginBottom: 3 },
  contactLabel: { width: 80, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#6B7280' },
  contactValue: { flex: 1, fontSize: 9.5 },
  footerDivider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 16, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

interface Props {
  course: CrmCourse
  eagleRate: string
  aceRate: string
  priorityHours: string
  eagleCredits: string
  aceCredits: string
  generatedAt: string
}

export function BenefitsSchedulePDF({ course, eagleRate, aceRate, priorityHours, eagleCredits, aceCredits, generatedAt }: Props) {
  const dateStr = generatedAt
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
            <Text style={S.docTitle}>Member Benefits Schedule</Text>
            <Text style={S.headerMeta}>Effective: {dateStr}</Text>
          </View>
        </View>

        <Text style={S.courseName}>{course.name}</Text>
        {location ? <Text style={S.courseLocation}>{location}</Text> : null}

        <Text style={S.intro}>
          This Benefits Schedule defines the member rates and privileges that {course.name} agrees to honor for active TeeAhead members. Please share with your pro shop staff and post at the check-in desk for reference.
        </Text>

        <View style={S.tiersRow}>
          <View style={S.tierBox}>
            <View style={S.tierBadge}><Text style={S.tierBadgeText}>Eagle</Text></View>
            <Text style={S.tierPrice}>$89 / month</Text>
            <View style={S.benefitRow}><Text style={S.benefitLabel}>Green Fee:</Text><Text style={S.benefitValue}>{eagleRate || 'See agreement'}</Text></View>
            <View style={S.benefitRow}><Text style={S.benefitLabel}>Priority Hours:</Text><Text style={S.benefitValue}>{priorityHours || 'Off-peak only'}</Text></View>
            <View style={S.benefitRow}><Text style={S.benefitLabel}>Barter Credits:</Text><Text style={S.benefitValue}>{eagleCredits ? `$${eagleCredits}/mo` : 'See agreement'}</Text></View>
          </View>
          <View style={S.tierSep} />
          <View style={S.tierBox}>
            <View style={S.tierBadge}><Text style={S.tierBadgeText}>Ace</Text></View>
            <Text style={S.tierPrice}>$159 / month</Text>
            <View style={S.benefitRow}><Text style={S.benefitLabel}>Green Fee:</Text><Text style={S.benefitValue}>{aceRate || 'See agreement'}</Text></View>
            <View style={S.benefitRow}><Text style={S.benefitLabel}>Priority Hours:</Text><Text style={S.benefitValue}>Peak + off-peak</Text></View>
            <View style={S.benefitRow}><Text style={S.benefitLabel}>Barter Credits:</Text><Text style={S.benefitValue}>{aceCredits ? `$${aceCredits}/mo` : 'See agreement'}</Text></View>
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>How to Verify Membership at Check-In</Text>
          {[
            'Ask the golfer to present their TeeAhead membership (app or email confirmation).',
            'Confirm the member name matches their ID and membership shows as "Active."',
            'Apply the applicable green fee rate for their tier (Eagle or Ace) as shown above.',
            'Log the round as a TeeAhead member round — your TeeAhead rep reconciles monthly.',
          ].map((text, i) => (
            <View key={i} style={S.stepRow}>
              <Text style={S.stepNum}>{i + 1}.</Text>
              <Text style={S.stepText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={S.noticeBox}>
          <Text style={S.noticeText}>
            <Text style={S.bold}>Important: </Text>
            Barter credits are issued by TeeAhead and applied to future bookings — your course collects full green fees directly. Credits do not reduce payment owed to the course. If a member presents an expired membership, standard rates apply.
          </Text>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>TeeAhead Contact</Text>
          <View style={S.contactRow}><Text style={S.contactLabel}>Name:</Text><Text style={S.contactValue}>Neil Barris, Co-Founder</Text></View>
          <View style={S.contactRow}><Text style={S.contactLabel}>Email:</Text><Text style={S.contactValue}>nbarris11@gmail.com</Text></View>
          <View style={S.contactRow}><Text style={S.contactLabel}>Website:</Text><Text style={S.contactValue}>teeahead.com</Text></View>
        </View>

        <View style={S.footerDivider}>
          <Text style={S.footerText}>TeeAhead, LLC · teeahead.com</Text>
          <Text style={S.footerText}>{course.name} · Benefits Schedule · {dateStr}</Text>
        </View>
      </Page>
    </Document>
  )
}
