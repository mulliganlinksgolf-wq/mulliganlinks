import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const S = StyleSheet.create({
  page: { padding: 52, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a', lineHeight: 1.5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottomWidth: 1.5, borderBottomColor: '#1B4332', paddingBottom: 10 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1B4332' },
  brandSub: { fontSize: 9, color: '#6B7280' },
  headerRight: { alignItems: 'flex-end' },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headerMeta: { fontSize: 9, color: '#6B7280' },
  partiesRow: { flexDirection: 'row', marginBottom: 14 },
  partyBox: { flex: 1, padding: 10, backgroundColor: '#F9FAFB' },
  partyLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6B7280', marginBottom: 4 },
  partyName: { fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  partyDetail: { fontSize: 9, color: '#4B5563' },
  partySep: { width: 10 },
  section: { marginBottom: 10 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 5, color: '#1B4332' },
  para: { fontSize: 9.5, marginBottom: 4, lineHeight: 1.5 },
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  bulletMark: { width: 18, fontSize: 9.5 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  sigBlock: { flexDirection: 'row', marginTop: 20 },
  sigCol: { flex: 1 },
  sigColSep: { width: 28 },
  sigParty: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 20 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginBottom: 4 },
  sigMeta: { fontSize: 8.5, color: '#6B7280', marginBottom: 8 },
  witnessText: { fontSize: 9.5, marginBottom: 16, marginTop: 8 },
  footerDivider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 16, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

interface Props {
  course: CrmCourse
  generatedAt: string
  contractYears: number
  monthlyFee: number
}

function agreementNumber(course: CrmCourse, generatedAt: string) {
  const year = new Date(generatedAt).getFullYear()
  const slug = course.name.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)
  return `TPA-${year}-${slug}`
}

export function FoundingPartnerAgreementPDF({ course, generatedAt, contractYears, monthlyFee }: Props) {
  const dateStr = new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const monthlyFeeStr = monthlyFee.toLocaleString()
  const annualFee = (monthlyFee * 12).toLocaleString()
  const endDate = new Date(generatedAt)
  endDate.setFullYear(endDate.getFullYear() + contractYears)
  const endDateStr = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const agreementNo = agreementNumber(course, generatedAt)
  const location = [course.city, course.state].filter(Boolean).join(', ')

  return (
    <Document>
      <Page size="LETTER" style={S.page}>

        {/* Header */}
        <View style={S.headerRow}>
          <View>
            <Text style={S.brand}>TeeAhead</Text>
            <Text style={S.brandSub}>teeahead.com</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.docTitle}>Founding Partner Agreement</Text>
            <Text style={S.headerMeta}>Agreement No.: {agreementNo}</Text>
            <Text style={S.headerMeta}>Effective Date: {dateStr}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={S.partiesRow}>
          <View style={S.partyBox}>
            <Text style={S.partyLabel}>COMPANY</Text>
            <Text style={S.partyName}>TeeAhead, LLC</Text>
            <Text style={S.partyDetail}>Metro Detroit, Michigan</Text>
            <Text style={S.partyDetail}>teeahead.com</Text>
          </View>
          <View style={S.partySep} />
          <View style={S.partyBox}>
            <Text style={S.partyLabel}>PARTNER COURSE</Text>
            <Text style={S.partyName}>{course.name}</Text>
            {location ? <Text style={S.partyDetail}>{location}</Text> : null}
            {course.contact_name ? <Text style={S.partyDetail}>{course.contact_name}</Text> : null}
            {course.contact_email ? <Text style={S.partyDetail}>{course.contact_email}</Text> : null}
          </View>
        </View>

        {/* Recitals */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>RECITALS</Text>
          <Text style={S.para}>WHEREAS, TeeAhead operates a subscription-based golf loyalty network connecting member golfers with partner golf courses throughout metro Detroit;</Text>
          <Text style={S.para}>WHEREAS, {course.name} desires to participate in the TeeAhead network as a Founding Partner and to receive the benefits, priority placement, and locked-in terms associated therewith;</Text>
          <Text style={S.para}>NOW, THEREFORE, in consideration of the mutual covenants set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</Text>
        </View>

        {/* Section 1: Definitions */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>1. Definitions</Text>
          <View style={S.bullet}><Text style={S.bulletMark}>(a)</Text><Text style={S.bulletText}><Text style={S.bold}>"Benefits Schedule"</Text> means the member benefit tiers, associated course discount rates, and barter credit values published by TeeAhead, as updated from time to time with thirty (30) days written notice to Partner Course.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(b)</Text><Text style={S.bulletText}><Text style={S.bold}>"Eagle Member"</Text> means a TeeAhead subscriber at the Eagle tier ($89/month), entitled to standard benefits at Partner Courses as defined in the Benefits Schedule.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(c)</Text><Text style={S.bulletText}><Text style={S.bold}>"Ace Member"</Text> means a TeeAhead subscriber at the Ace tier ($159/month), entitled to premium benefits at Partner Courses as defined in the Benefits Schedule.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(d)</Text><Text style={S.bulletText}><Text style={S.bold}>"Platform"</Text> means TeeAhead's web application, member portal, booking tools, and associated services available at teeahead.com.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(e)</Text><Text style={S.bulletText}><Text style={S.bold}>"Founding Partner Period"</Text> means the Initial Term defined in Section 5 below.</Text></View>
        </View>

        {/* Section 2: Partner Course Obligations */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>2. Partner Course Obligations</Text>
          <Text style={S.para}>During the Term, {course.name} agrees to:</Text>
          <View style={S.bullet}><Text style={S.bulletMark}>(a)</Text><Text style={S.bulletText}>Honor TeeAhead Member benefits for all Eagle and Ace Members presenting valid TeeAhead membership at the time of play, in accordance with the Benefits Schedule then in effect;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(b)</Text><Text style={S.bulletText}>Maintain accurate tee time availability information on the Platform, or provide updated availability to TeeAhead within forty-eight (48) hours of any material change to the tee sheet;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(c)</Text><Text style={S.bulletText}>Designate a primary point of contact for TeeAhead communications and respond to TeeAhead inquiries within three (3) business days;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(d)</Text><Text style={S.bulletText}>Participate in a minimum of two (2) co-marketing initiatives per calendar year, which may include email promotions, seasonal tee time offers, or Platform feature placements, coordinated with TeeAhead's marketing team;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(e)</Text><Text style={S.bulletText}>Refrain from publicly disparaging TeeAhead or the TeeAhead Platform during the Term.</Text></View>
        </View>

        {/* Section 3: TeeAhead Obligations */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>3. TeeAhead Obligations</Text>
          <Text style={S.para}>During the Term, TeeAhead agrees to:</Text>
          <View style={S.bullet}><Text style={S.bulletMark}>(a)</Text><Text style={S.bulletText}>List {course.name} on the Platform as a Founding Partner, with permanent "Founding Partner" designation and priority placement in member search results and recommendations throughout the Founding Partner Period;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(b)</Text><Text style={S.bulletText}>Actively market {course.name} to the TeeAhead member base through Platform features, email campaigns, and digital channels at TeeAhead's reasonable discretion;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(c)</Text><Text style={S.bulletText}>Provide Partner Course with a monthly activity report summarizing TeeAhead Member visits, round bookings, and benefit redemptions attributable to TeeAhead;</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(d)</Text><Text style={S.bulletText}>Lock all material partner terms — including the Platform Fee, benefit rates, and Founding Partner placement — for the full Initial Term. No unilateral fee increase or material term change will be made without sixty (60) days written notice and Partner Course written consent.</Text></View>
        </View>

        {/* Section 4: Platform Fee */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>4. Platform Fee</Text>
          <Text style={S.para}>
            Partner Course agrees to pay TeeAhead a monthly Platform Fee of <Text style={S.bold}>${monthlyFeeStr} USD</Text> (the "Platform Fee"), due on the first (1st) calendar day of each month. The Platform Fee for the first full month following execution is waived as a complimentary onboarding period.
          </Text>
          <Text style={S.para}>
            Annual equivalent: <Text style={S.bold}>${annualFee} USD</Text>. The Platform Fee is all-inclusive and covers Platform listing, member traffic generation, monthly reporting, and co-marketing services. TeeAhead does not charge per-round commissions, booking fees, or revenue share of any kind.
          </Text>
          <Text style={S.para}>
            Payments past thirty (30) days overdue shall accrue interest at the rate of 1.5% per month. TeeAhead reserves the right to suspend Platform listing for accounts more than thirty (30) days past due.
          </Text>
        </View>

        {/* Section 5: Term */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>5. Term and Renewal</Text>
          <Text style={S.para}>
            This Agreement commences on the Effective Date and continues for a period of <Text style={S.bold}>{contractYears} {contractYears === 1 ? 'year' : 'years'}</Text> (the "Initial Term"), expiring on <Text style={S.bold}>{endDateStr}</Text>. Upon expiration of the Initial Term, this Agreement will automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal no fewer than sixty (60) days prior to the end of the then-current term.
          </Text>
        </View>

        {/* Section 6: Termination */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>6. Termination</Text>
          <Text style={S.para}>
            Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice. Either party may terminate immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within fifteen (15) days of written notice describing the breach in reasonable detail. Upon termination, Partner Course will be removed from the Platform within five (5) business days and any prepaid Platform Fees for unused complete months will be refunded on a pro-rata basis.
          </Text>
        </View>

        {/* Section 7: Limitation of Liability */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={S.para}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TEEAHEAD'S AGGREGATE LIABILITY FOR ANY AND ALL CLAIMS ARISING UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL PLATFORM FEES PAID BY PARTNER COURSE IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
          </Text>
        </View>

        {/* Section 8: General */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>8. General Provisions</Text>
          <View style={S.bullet}><Text style={S.bulletMark}>(a)</Text><Text style={S.bulletText}><Text style={S.bold}>Governing Law.</Text> This Agreement is governed by and construed in accordance with the laws of the State of Michigan, without regard to its conflict-of-law principles. Any disputes arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in Wayne County, Michigan.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(b)</Text><Text style={S.bulletText}><Text style={S.bold}>Entire Agreement.</Text> This Agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior negotiations, representations, warranties, and understandings of the parties with respect thereto.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(c)</Text><Text style={S.bulletText}><Text style={S.bold}>Amendments.</Text> No amendment, modification, or waiver of any provision of this Agreement shall be effective unless in writing and signed by authorized representatives of both parties.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(d)</Text><Text style={S.bulletText}><Text style={S.bold}>Severability.</Text> If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect to the maximum extent permitted by law.</Text></View>
          <View style={S.bullet}><Text style={S.bulletMark}>(e)</Text><Text style={S.bulletText}><Text style={S.bold}>Counterparts.</Text> This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed valid.</Text></View>
        </View>

        {/* IN WITNESS WHEREOF */}
        <Text style={S.witnessText}>
          IN WITNESS WHEREOF, the parties have executed this Founding Partner Agreement as of the Effective Date first written above.
        </Text>

        <View style={S.sigBlock}>
          <View style={S.sigCol}>
            <Text style={S.sigParty}>TEEAHEAD, LLC</Text>
            <View style={S.sigLine} />
            <Text style={S.sigMeta}>Signature</Text>
            <Text style={S.sigMeta}>Neil Barris, Co-Founder</Text>
            <Text style={S.sigMeta}>Date: ___________________________</Text>
          </View>
          <View style={S.sigColSep} />
          <View style={S.sigCol}>
            <Text style={S.sigParty}>{course.name.toUpperCase()}</Text>
            <View style={S.sigLine} />
            <Text style={S.sigMeta}>Signature</Text>
            <Text style={S.sigMeta}>Print Name: ___________________________</Text>
            <Text style={S.sigMeta}>Title: ___________________________</Text>
            <Text style={S.sigMeta}>Date: ___________________________</Text>
          </View>
        </View>

        <View style={S.footerDivider}>
          <Text style={S.footerText}>TeeAhead, LLC · teeahead.com</Text>
          <Text style={S.footerText}>Agreement No. {agreementNo} · Confidential</Text>
        </View>

      </Page>
    </Document>
  )
}
