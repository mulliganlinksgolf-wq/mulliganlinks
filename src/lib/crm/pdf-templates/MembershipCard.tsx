import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmMember } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica', backgroundColor: '#F9FAFB' },
  card: { margin: 60, backgroundColor: '#FFFFFF' },
  cardTop: { backgroundColor: '#1B4332', padding: 28 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  tierBadge: { backgroundColor: '#FFFFFF', padding: 6 },
  tierBadgeText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  memberLabel: { fontSize: 9, color: '#A7F3D0', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  memberName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 4 },
  memberEmail: { fontSize: 10, color: '#A7F3D0' },
  cardBottom: { padding: 28 },
  benefitsLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6B7280', marginBottom: 12 },
  benefitsRow: { flexDirection: 'row', marginBottom: 10 },
  benefitItem: { flex: 1 },
  benefitCheck: { fontSize: 9, color: '#059669', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  benefitTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 1 },
  benefitSub: { fontSize: 8.5, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: '#E5E7EB' },
  footerLeft: { fontSize: 9, color: '#6B7280' },
  footerRight: { fontSize: 9, color: '#6B7280' },
  instruction: { textAlign: 'center', fontSize: 9, color: '#9CA3AF', marginTop: 16 },
})

const EAGLE_BENEFITS: [string, string][] = [
  ['Standard Green Fee Rate', 'At all partner courses'],
  ['Off-Peak Tee Priority', 'Mon-Fri, early AM/twilight'],
  ['Monthly Barter Credits', 'Toward future rounds'],
  ['Full Course Network', 'All TeeAhead partners'],
]

const ACE_BENEFITS: [string, string][] = [
  ['Premium Green Fee Rate', 'At all partner courses'],
  ['Peak + Off-Peak Priority', 'Anytime, any day'],
  ['Enhanced Barter Credits', 'Higher monthly value'],
  ['Guest Pass Privileges', '1 guest per round'],
]

interface Props {
  member: CrmMember
  generatedAt: string
}

export function MembershipCardPDF({ member, generatedAt }: Props) {
  const tier = member.membership_tier ?? 'eagle'
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
  const benefits = tier === 'ace' ? ACE_BENEFITS : EAGLE_BENEFITS
  const joinYear = member.join_date
    ? new Date(member.join_date + 'T12:00:00').getFullYear()
    : new Date(generatedAt || new Date().toISOString()).getFullYear()

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        <View style={S.card}>
          <View style={S.cardTop}>
            <View style={S.brandRow}>
              <Text style={S.brand}>TeeAhead</Text>
              <View style={S.tierBadge}>
                <Text style={S.tierBadgeText}>{tierLabel} Member</Text>
              </View>
            </View>
            <Text style={S.memberLabel}>MEMBER</Text>
            <Text style={S.memberName}>{member.name}</Text>
            {member.email ? <Text style={S.memberEmail}>{member.email}</Text> : null}
          </View>

          <View style={S.cardBottom}>
            <Text style={S.benefitsLabel}>YOUR MEMBER BENEFITS</Text>
            <View style={S.benefitsRow}>
              {benefits.slice(0, 2).map(([title, sub], i) => (
                <View key={i} style={S.benefitItem}>
                  <Text style={S.benefitCheck}>✓ </Text>
                  <Text style={S.benefitTitle}>{title}</Text>
                  <Text style={S.benefitSub}>{sub}</Text>
                </View>
              ))}
            </View>
            <View style={S.benefitsRow}>
              {benefits.slice(2, 4).map(([title, sub], i) => (
                <View key={i} style={S.benefitItem}>
                  <Text style={S.benefitCheck}>✓ </Text>
                  <Text style={S.benefitTitle}>{title}</Text>
                  <Text style={S.benefitSub}>{sub}</Text>
                </View>
              ))}
            </View>
            <View style={S.cardFooter}>
              <Text style={S.footerLeft}>Valid at all TeeAhead partner courses · teeahead.com</Text>
              <Text style={S.footerRight}>Member since {joinYear}</Text>
            </View>
          </View>
        </View>

        <Text style={S.instruction}>Present this card at the pro shop or show on your device · Questions? nbarris11@gmail.com</Text>
      </Page>
    </Document>
  )
}
