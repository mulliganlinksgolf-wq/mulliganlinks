import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PnlRow } from '@/lib/reports/financial'
import { EXPENSE_CATEGORIES } from '@/lib/reports/financial'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1A1A1A' },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1B4332', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#6B7770' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellRight: { flex: 1, paddingHorizontal: 4, textAlign: 'right' },
  headerRow: { flexDirection: 'row', paddingVertical: 4, backgroundColor: '#F9FAFB', marginBottom: 2 },
  bold: { fontWeight: 'bold' },
  positive: { color: '#065F46' },
  negative: { color: '#991B1B' },
})

export default function PnlPdf({ rows, generatedAt }: { rows: PnlRow[]; generatedAt: string }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>TeeAhead — P&L Report</Text>
          <Text style={s.subtitle}>Generated {generatedAt}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Monthly P&L</Text>
          <View style={s.headerRow}>
            <Text style={[s.cell, s.bold]}>Month</Text>
            <Text style={[s.cellRight, s.bold]}>Revenue</Text>
            {EXPENSE_CATEGORIES.map(c => (
              <Text key={c} style={[s.cellRight, s.bold]}>{c}</Text>
            ))}
            <Text style={[s.cellRight, s.bold]}>Expenses</Text>
            <Text style={[s.cellRight, s.bold]}>Net</Text>
          </View>
          {rows.map(row => (
            <View key={row.month} style={s.row}>
              <Text style={s.cell}>{row.month}</Text>
              <Text style={[s.cellRight, s.positive]}>${row.revenue.toLocaleString()}</Text>
              {EXPENSE_CATEGORIES.map(c => (
                <Text key={c} style={s.cellRight}>${(row.expenses[c] ?? 0).toLocaleString()}</Text>
              ))}
              <Text style={s.cellRight}>${row.totalExpenses.toLocaleString()}</Text>
              <Text style={[s.cellRight, row.net >= 0 ? s.positive : s.negative]}>
                ${row.net.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
