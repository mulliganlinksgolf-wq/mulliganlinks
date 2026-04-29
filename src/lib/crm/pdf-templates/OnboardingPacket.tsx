import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 52, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  headerBand: { backgroundColor: '#1B4332', padding: 18, marginBottom: 22 },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 2 },
  tagline: { fontSize: 10, color: '#A7F3D0' },
  welcomeTitle: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  welcomeSub: { fontSize: 10, color: '#6B7280', marginBottom: 18 },
  intro: { fontSize: 9.5, lineHeight: 1.7, marginBottom: 18, color: '#374151' },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#D1FAE5', paddingBottom: 3 },
  stepRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  stepBadge: { width: 20, height: 20, backgroundColor: '#1B4332', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  stepBadgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center' },
  stepContent: { flex: 1 },
  stepTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2 },
  stepDesc: { fontSize: 9.5, color: '#4B5563', lineHeight: 1.5 },
  tiersRow: { flexDirection: 'row', marginBottom: 8 },
  tierBox: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#D1FAE5' },
  tierSep: { width: 8 },
  tierName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1B4332', marginBottom: 2 },
  tierPrice: { fontSize: 9.5, color: '#059669', fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  tierBenefit: { fontSize: 9, color: '#4B5563', lineHeight: 1.4 },
  tierNote: { fontSize: 8.5, color: '#6B7280', marginBottom: 14 },
  infoBox: { backgroundColor: '#F0FDF4', padding: 12, borderWidth: 1, borderColor: '#6EE7B7', marginBottom: 14 },
  infoTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1B4332', marginBottom: 5 },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 80, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#6B7280' },
  infoValue: { flex: 1, fontSize: 9.5 },
  closingText: { fontSize: 9.5, lineHeight: 1.7, color: '#374151', marginBottom: 10 },
  signature: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  footerDivider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 14, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

interface Props {
  course: CrmCourse
  generatedAt: string
}

export function OnboardingPacketPDF({ course, generatedAt }: Props) {
  const dateStr = new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        <View style={S.headerBand}>
          <Text style={S.brand}>TeeAhead</Text>
          <Text style={S.tagline}>Metro Detroit's Local Golf Loyalty Network · teeahead.com</Text>
        </View>

        <Text style={S.welcomeTitle}>Welcome to TeeAhead, {course.name}!</Text>
        <Text style={S.welcomeSub}>Founding Partner Onboarding Guide · {dateStr}</Text>

        <Text style={S.intro}>
          You're officially part of the TeeAhead network — thank you for being a Founding Partner. This guide covers exactly what happens next, what your staff needs to know, and how to get the most out of your partnership from day one.
        </Text>

        <View style={S.section}>
          <Text style={S.sectionTitle}>What Happens Next — Your First 30 Days</Text>
          {([
            ['Your listing is now live on TeeAhead.com', `Members searching for courses in your area will see ${course.name} with your Founding Partner badge. No action needed on your end.`],
            ['Review your Benefits Schedule', 'Your customized Benefits Schedule is attached. Share it with your pro shop staff and post it at the check-in desk — it defines exactly what each member tier gets.'],
            ['Brief your pro shop team', 'Let your staff know that TeeAhead members will start coming through. Process: verify active membership (app or email), apply the rate from the Benefits Schedule, record the round normally.'],
            ['Your first monthly report arrives on the 1st', "On the 1st of next month, you'll receive a TeeAhead activity report showing member visits, rounds played, and redemptions. This is your proof of performance."],
          ] as [string, string][]).map(([title, desc], i) => (
            <View key={i} style={S.stepRow}>
              <View style={S.stepBadge}><Text style={S.stepBadgeText}>{i + 1}</Text></View>
              <View style={S.stepContent}>
                <Text style={S.stepTitle}>{title}</Text>
                <Text style={S.stepDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Member Tiers — Quick Reference for Staff</Text>
          <View style={S.tiersRow}>
            <View style={S.tierBox}>
              <Text style={S.tierName}>Eagle Member</Text>
              <Text style={S.tierPrice}>$89/mo subscription</Text>
              <Text style={S.tierBenefit}>{'• Standard member green fee rate\n• Off-peak tee time priority\n• Monthly barter credits'}</Text>
            </View>
            <View style={S.tierSep} />
            <View style={S.tierBox}>
              <Text style={S.tierName}>Ace Member</Text>
              <Text style={S.tierPrice}>$159/mo subscription</Text>
              <Text style={S.tierBenefit}>{'• Premium green fee rate\n• Peak + off-peak priority\n• Enhanced barter credits + guest pass'}</Text>
            </View>
          </View>
          <Text style={S.tierNote}>Exact rates for your course are on your Benefits Schedule. All green fees are collected directly by your course — no revenue goes through TeeAhead.</Text>
        </View>

        <View style={S.infoBox}>
          <Text style={S.infoTitle}>Your TeeAhead Contact</Text>
          <View style={S.infoRow}><Text style={S.infoLabel}>Name:</Text><Text style={S.infoValue}>Neil Barris, Co-Founder</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Email:</Text><Text style={S.infoValue}>nbarris11@gmail.com</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Website:</Text><Text style={S.infoValue}>teeahead.com</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Reports:</Text><Text style={S.infoValue}>Monthly, delivered by email on the 1st</Text></View>
        </View>

        <Text style={S.closingText}>
          We're thrilled to have {course.name} as a Founding Partner. If anything is unclear, if you want to adjust your benefit rates, or if you just have a question — reply to any TeeAhead email or reach out directly.
        </Text>

        <Text style={S.signature}>Neil Barris & Billy Eslock{'\n'}TeeAhead Co-Founders</Text>

        <View style={S.footerDivider}>
          <Text style={S.footerText}>TeeAhead, LLC · teeahead.com</Text>
          <Text style={S.footerText}>{course.name} · Onboarding Packet · {dateStr}</Text>
        </View>
      </Page>
    </Document>
  )
}
