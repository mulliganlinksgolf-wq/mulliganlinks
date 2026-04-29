import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 52, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  headerBand: { backgroundColor: '#1B4332', padding: 18, marginBottom: 20 },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 2 },
  tagline: { fontSize: 10, color: '#A7F3D0' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 2 },
  addressee: { fontSize: 10, color: '#6B7280', marginBottom: 18 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 7, borderBottomWidth: 1, borderBottomColor: '#D1FAE5', paddingBottom: 3 },
  para: { fontSize: 9.5, lineHeight: 1.6, marginBottom: 5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  bullet: { flexDirection: 'row', marginBottom: 5 },
  dot: { width: 14, color: '#059669', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
  stepsRow: { flexDirection: 'row', marginBottom: 14 },
  step: { flex: 1, padding: 10, backgroundColor: '#F0FDF4' },
  stepNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  stepTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, marginBottom: 3 },
  stepDesc: { fontSize: 8.5, color: '#4B5563', lineHeight: 1.4 },
  stepSep: { width: 6 },
  tiersRow: { flexDirection: 'row', marginBottom: 8 },
  tierBox: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#D1FAE5' },
  tierName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1B4332', marginBottom: 2 },
  tierPrice: { fontSize: 10, color: '#059669', fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  tierBenefit: { fontSize: 9, color: '#4B5563', lineHeight: 1.5 },
  tierSep: { width: 6 },
  tierNote: { fontSize: 8.5, color: '#6B7280', marginBottom: 14 },
  pricingBox: { backgroundColor: '#F0FDF4', padding: 12, borderWidth: 1, borderColor: '#6EE7B7', marginBottom: 14 },
  pricingTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1B4332', marginBottom: 5 },
  pricingRow: { flexDirection: 'row', marginBottom: 3 },
  pricingDot: { width: 14, color: '#059669' },
  pricingText: { flex: 1, fontSize: 9.5, lineHeight: 1.4 },
  ctaBox: { backgroundColor: '#1B4332', padding: 14 },
  ctaText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  ctaDetail: { fontSize: 9.5, color: '#A7F3D0', textAlign: 'center' },
  footerDivider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 14, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

interface Props { course: CrmCourse }

export function CourseProposalPDF({ course }: Props) {
  const year = new Date().getFullYear()
  const contactName = course.contact_name ?? 'Golf Course Management'

  return (
    <Document>
      <Page size="LETTER" style={S.page}>

        <View style={S.headerBand}>
          <Text style={S.brand}>TeeAhead</Text>
          <Text style={S.tagline}>Metro Detroit's Local Golf Loyalty Network · teeahead.com</Text>
        </View>

        <Text style={S.docTitle}>Partnership Proposal</Text>
        <Text style={S.addressee}>Prepared exclusively for: {contactName} · {course.name}</Text>

        {/* Executive Summary */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Executive Summary</Text>
          <Text style={S.para}>
            TeeAhead is a subscription-based golf loyalty network built for metro Detroit. Golfers pay a monthly membership and receive exclusive benefits — discounted rounds, priority tee times, and barter credits — at our network of partner courses. Partner courses pay a single flat monthly Platform Fee and gain access to a curated base of active, paying golfers with no per-round commissions, no revenue share, and no technology lift required.
          </Text>
          <Text style={S.para}>
            We are inviting a limited group of courses to join as Founding Partners before our public launch. {course.name} is an ideal fit for the TeeAhead network, and we are reserving a spot.
          </Text>
        </View>

        {/* How It Works */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>How It Works</Text>
          <View style={S.stepsRow}>
            <View style={S.step}>
              <Text style={S.stepNum}>1</Text>
              <Text style={S.stepTitle}>Golfers Subscribe</Text>
              <Text style={S.stepDesc}>Members join TeeAhead at the Eagle ($89/mo) or Ace ($159/mo) tier and gain access to all partner courses in the network.</Text>
            </View>
            <View style={S.stepSep} />
            <View style={S.step}>
              <Text style={S.stepNum}>2</Text>
              <Text style={S.stepTitle}>Members Book Rounds</Text>
              <Text style={S.stepDesc}>Members browse partner courses and book tee times through TeeAhead or by calling your pro shop directly, presenting their membership at check-in.</Text>
            </View>
            <View style={S.stepSep} />
            <View style={S.step}>
              <Text style={S.stepNum}>3</Text>
              <Text style={S.stepTitle}>You Get the Round</Text>
              <Text style={S.stepDesc}>Your course collects green fees and any additional revenue directly. TeeAhead charges no per-round fee, no commission, and no revenue share.</Text>
            </View>
          </View>
        </View>

        {/* Membership Tiers */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Member Tiers — What Your Course Honors</Text>
          <View style={S.tiersRow}>
            <View style={S.tierBox}>
              <Text style={S.tierName}>Eagle</Text>
              <Text style={S.tierPrice}>$89 / month</Text>
              <Text style={S.tierBenefit}>
                {'• Standard member green fee rate\n• Off-peak tee time priority access\n• Monthly barter credits toward rounds\n• Access to all network partner courses'}
              </Text>
            </View>
            <View style={S.tierSep} />
            <View style={S.tierBox}>
              <Text style={S.tierName}>Ace</Text>
              <Text style={S.tierPrice}>$159 / month</Text>
              <Text style={S.tierBenefit}>
                {'• Premium member green fee rate\n• Peak-hour and weekend tee time priority\n• Enhanced barter credits + guest pass privileges\n• Early access to new courses and features'}
              </Text>
            </View>
          </View>
          <Text style={S.tierNote}>Exact benefit rates are negotiated during onboarding and locked for the full contract term. You set the rates — we drive the members to your door.</Text>
        </View>

        {/* Pricing */}
        <View style={S.pricingBox}>
          <Text style={S.pricingTitle}>Course Pricing — Simple and Predictable</Text>
          {([
            ['$349/month', 'flat Platform Fee — no per-round commissions, no revenue share'],
            ['First month free', 'complimentary onboarding period for all new partners'],
            ['Rate locked', 'Founding Partner fee guaranteed for the full contract term'],
            ['Cancel anytime', '30 days written notice — no long-term trap clauses'],
          ] as [string, string][]).map(([label, desc], i) => (
            <View key={i} style={S.pricingRow}>
              <Text style={S.pricingDot}>•</Text>
              <Text style={S.pricingText}><Text style={S.bold}>{label}</Text> — {desc}</Text>
            </View>
          ))}
        </View>

        {/* Why Partner */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Why Partner with TeeAhead?</Text>
          {([
            ['Incremental rounds at zero acquisition cost', 'We bring committed, paying golfers to you — no GolfNow-style discounting, no last-minute fire-sales.'],
            ['Fill off-peak and shoulder-season inventory', 'Member offers are targeted to weekday, twilight, and shoulder-season slots — the tee times that are hardest to fill.'],
            ['No technology integration required', 'You manage your tee sheet exactly as you do today. No new software, no POS changes, no training overhead.'],
            ['Monthly performance analytics', 'Know exactly how many TeeAhead Members visited, what they played, and what revenue they generated.'],
            ['Co-marketing included at no extra cost', 'Your course is featured in TeeAhead email campaigns, homepage spotlights, and seasonal promotions to our growing member list.'],
          ] as [string, string][]).map(([title, desc], i) => (
            <View key={i} style={S.bullet}>
              <Text style={S.dot}>•</Text>
              <Text style={S.bulletText}><Text style={S.bold}>{title}.</Text> {desc}</Text>
            </View>
          ))}
        </View>

        {/* Founding Partner Benefits */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Founding Partner Benefits</Text>
          {([
            ['Permanent "Founding Partner" badge', 'Displayed on your TeeAhead listing indefinitely — visible to every member who searches or browses your course.'],
            ['Priority placement in search and recommendations', 'Founding Partners appear first in member search results, course spotlights, and homepage features for the life of the network.'],
            ['Founding Partner rate lock', 'Your $349/mo Platform Fee is locked for the full contract term. We cannot raise your rate without sixty days notice and your written consent.'],
            ['Direct founder access', 'Monthly check-in with the TeeAhead founding team. Your feedback directly shapes our product roadmap and member features.'],
          ] as [string, string][]).map(([title, desc], i) => (
            <View key={i} style={S.bullet}>
              <Text style={S.dot}>•</Text>
              <Text style={S.bulletText}><Text style={S.bold}>{title}.</Text> {desc}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={S.ctaBox}>
          <Text style={S.ctaText}>Ready to join the TeeAhead network?</Text>
          <Text style={S.ctaDetail}>Reply to this proposal or schedule a 20-minute demo · teeahead.com · nbarris11@gmail.com</Text>
        </View>

        <View style={S.footerDivider}>
          <Text style={S.footerText}>TeeAhead, LLC · teeahead.com</Text>
          <Text style={S.footerText}>Confidential · {year}</Text>
        </View>

      </Page>
    </Document>
  )
}
