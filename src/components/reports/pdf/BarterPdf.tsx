// src/components/reports/pdf/BarterPdf.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { calcBarterSavings } from '@/lib/reports/barter'
import { calcStaffHoursSaved } from '@/lib/reports/courseMetrics'

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 11, color: '#1A1A1A', backgroundColor: '#FFFFFF' },
  header: { marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 22, fontWeight: 'bold', color: '#1B4332' },
  brandSub: { fontSize: 11, color: '#6B7770', marginTop: 2 },
  courseName: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  month: { fontSize: 11, color: '#6B7770', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#1B4332', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  kpiBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#1B4332' },
  kpiLabel: { fontSize: 9, color: '#6B7770', marginTop: 2, textAlign: 'center' },
  barterBox: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 8, padding: 16, marginBottom: 12, alignItems: 'center' },
  barterAmount: { fontSize: 28, fontWeight: 'bold', color: '#B45309' },
  barterLabel: { fontSize: 10, color: '#92400E', marginTop: 4 },
  zeroBox: { backgroundColor: '#1B4332', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12 },
  zeroAmount: { fontSize: 32, fontWeight: 'bold', color: '#FAF7F2' },
  zeroLabel: { fontSize: 10, color: '#FAF7F2', opacity: 0.7, marginTop: 2 },
  footer: { marginTop: 'auto', paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: '#9CA3AF' },
})

interface BarterPdfProps {
  courseName: string
  month: string
  roundsMtd: number
  avgGreenFee: number
  revenueMtd: number
  waitlistFills: number
  membersMtd: number
  monthsElapsed: number
}

export default function BarterPdf({
  courseName, month, roundsMtd, avgGreenFee, revenueMtd, waitlistFills, membersMtd, monthsElapsed,
}: BarterPdfProps) {
  const savings = calcBarterSavings({ rounds: roundsMtd, avgGreenFee, waitlistFills, monthsElapsed })
  const staffHours = calcStaffHoursSaved(waitlistFills)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>TeeAhead</Text>
            <Text style={s.brandSub}>Monthly Performance Report</Text>
          </View>
          <View>
            <Text style={s.courseName}>{courseName}</Text>
            <Text style={s.month}>{month}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>This Month at a Glance</Text>
          <View style={s.kpiGrid}>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>${revenueMtd.toLocaleString()}</Text>
              <Text style={s.kpiLabel}>Revenue Processed</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{roundsMtd.toLocaleString()}</Text>
              <Text style={s.kpiLabel}>Rounds Booked</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{membersMtd}</Text>
              <Text style={s.kpiLabel}>New Members</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{staffHours}h</Text>
              <Text style={s.kpiLabel}>Staff Hours Saved</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>The TeeAhead Difference vs. GolfNow</Text>
          <View style={s.barterBox}>
            <Text style={{ fontSize: 10, color: '#92400E', marginBottom: 8 }}>
              If you were still on GolfNow (20% barter on {roundsMtd} rounds × ${avgGreenFee} avg green fee):
            </Text>
            <Text style={s.barterAmount}>${savings.golfnowCostMtd.toLocaleString()}</Text>
            <Text style={s.barterLabel}>surrendered in tee time value this month</Text>
            {monthsElapsed > 1 && (
              <Text style={{ fontSize: 9, color: '#B45309', marginTop: 6 }}>
                YTD barter cost avoided: ${savings.golfnowCostYtd.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={s.zeroBox}>
            <Text style={s.zeroLabel}>Your TeeAhead cost this month</Text>
            <Text style={s.zeroAmount}>$0</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>TeeAhead · Golf loyalty done right · teeahead.com</Text>
          <Text style={s.footerText}>Generated {new Date().toLocaleDateString('en-US')}</Text>
        </View>
      </Page>
    </Document>
  )
}
