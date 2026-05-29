// Monthly NGCOA-methodology Barter Receipt, the strategic shareable
// artifact that goes to every active partner course on the 1st of each
// month. Distinct from BarterPdf.tsx (which is the on-demand operator
// dashboard download using the simpler 20% model).
//
// The "How this is calculated" footer and source citations are NON-NEGOTIABLE
// per the sprint brief. They're what keeps the document credible when a GM
// forwards it to a peer still on GolfNow.

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { MonthlyBarterCalc } from '@/lib/reports/barter'
import fs from 'node:fs'
import path from 'node:path'

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 11, color: '#1A1A1A', backgroundColor: '#FFFFFF' },
  logo: { width: 100, marginBottom: 28 },
  brandFallback: { fontSize: 22, fontWeight: 'bold', color: '#1B4332', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6 },
  subtitle: { fontSize: 12, color: '#6B7770', marginBottom: 28 },

  heroDark: { backgroundColor: '#0E4A2E', borderRadius: 10, padding: 22, marginBottom: 24 },
  heroLabel: { fontSize: 10, color: '#D7E8DF', marginBottom: 4 },
  heroValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  heroDivider: { height: 10 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  rowLabel: { fontSize: 11, color: '#1A1A1A' },
  rowValue: { fontSize: 11, fontWeight: 'bold', color: '#1A1A1A' },

  bottomLine: { fontSize: 13, fontWeight: 'bold', marginTop: 18, color: '#1B4332' },

  footer: { marginTop: 28, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: '#D1D5DB' },
  footerHead: { fontSize: 9, fontWeight: 'bold', color: '#6B7770', marginBottom: 4 },
  footerText: { fontSize: 8.5, color: '#6B7770', lineHeight: 1.5 },
  footerSpacer: { height: 8 },
})

let logoBuffer: Buffer | null = null
function getLogo(): Buffer | null {
  if (logoBuffer) return logoBuffer
  try {
    const p = path.join(process.cwd(), 'public', 'brand', 'teeahead-logo-final.png')
    logoBuffer = fs.readFileSync(p)
    return logoBuffer
  } catch {
    return null
  }
}

interface MonthlyBarterReceiptPdfProps {
  courseName: string
  monthLabel: string // e.g. "April 2026"
  calc: MonthlyBarterCalc
}

export default function MonthlyBarterReceiptPdf({
  courseName,
  monthLabel,
  calc,
}: MonthlyBarterReceiptPdfProps) {
  const logo = getLogo()
  const dollars = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  const dollarsCents = (n: number) => `$${n.toFixed(2)}`

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {logo ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image is not an HTML img
          <Image src={logo} style={s.logo} />
        ) : (
          <Text style={s.brandFallback}>TeeAhead</Text>
        )}

        <Text style={s.title}>What GolfNow Would Have Cost You</Text>
        <Text style={s.subtitle}>{courseName}, {monthLabel}</Text>

        <View style={s.heroDark}>
          <Text style={s.heroLabel}>Estimated GolfNow barter cost this month</Text>
          <Text style={s.heroValue}>{dollars(calc.estimatedBarterCost)}</Text>
          <View style={s.heroDivider} />
          <Text style={s.heroLabel}>Your cost on TeeAhead</Text>
          <Text style={s.heroValue}>$0</Text>
        </View>

        <View style={s.row}>
          <Text style={s.rowLabel}>Total rounds played</Text>
          <Text style={s.rowValue}>{calc.totalRounds.toLocaleString()}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Peak-hour rounds</Text>
          <Text style={s.rowValue}>
            {calc.peakRounds.toLocaleString()} ({calc.peakPct.toFixed(1)}%)
          </Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Estimated GolfNow barter share (30% of peak)</Text>
          <Text style={s.rowValue}>{calc.estimatedBarterRounds.toLocaleString()} rounds</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Average green fee this month</Text>
          <Text style={s.rowValue}>{dollarsCents(calc.avgGreenFee)}</Text>
        </View>

        <Text style={s.bottomLine}>
          That&apos;s roughly {dollars(calc.estimatedBarterCost)} in green fees you didn&apos;t surrender this month.
        </Text>

        <View style={s.footer}>
          <Text style={s.footerHead}>How this is calculated</Text>
          <Text style={s.footerText}>
            We multiply your peak-hour rounds by 30% (the conservative middle of the NGCOA/ORCA published 25–40%
            range for the share of peak inventory GolfNow typically takes as barter), then by your actual
            average green fee, then by 0.85 (GolfNow&apos;s effective take rate after resale discount). This is
            an estimate; your actual GolfNow cost depends on the specific terms in your contract. The NGCOA/ORCA
            Operator Barter Cost Study (analyzing ~400 courses) found the average annual barter cost per
            course is $37,000.
          </Text>
          <View style={s.footerSpacer} />
          <Text style={s.footerHead}>Sources</Text>
          <Text style={s.footerText}>
            NGCOA/ORCA Operator Barter Cost Study (~400 courses); Brown Golf published case study (39.6% of
            rounds over 3 years were zero-revenue barter); Windsor Parke +382% online revenue lift after
            leaving GolfNow.
          </Text>
          <View style={s.footerSpacer} />
          <Text style={s.footerText}>
            Not affiliated with or endorsed by GolfNow or NBC Sports Next. Generated by TeeAhead for {courseName}.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
