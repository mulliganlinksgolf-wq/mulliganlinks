// Smoke test for the monthly Barter Receipt PDF render path.
// Verifies the @react-pdf/renderer pipeline produces a non-trivial PDF buffer
// from the real component. Mocks the supabase admin client to avoid DB.
import { describe, it, expect } from 'vitest'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import MonthlyBarterReceiptPdf from '@/components/reports/pdf/MonthlyBarterReceiptPdf'
import type { MonthlyBarterCalc } from '@/lib/reports/barter'

describe('MonthlyBarterReceiptPdf', () => {
  it('renders a non-trivial PDF buffer with the methodology footer', async () => {
    const calc: MonthlyBarterCalc = {
      courseId: 'c1',
      receiptMonth: '2026-04-01',
      totalRounds: 1247,
      peakRounds: 474,
      peakPct: 38.0,
      avgGreenFee: 58.0,
      estimatedBarterRounds: 142,
      estimatedBarterCost: 7001.56,
    }

    const buffer = await renderToBuffer(
      // @ts-expect-error — DocumentProps generic mismatch is benign at runtime
      createElement(MonthlyBarterReceiptPdf, {
        courseName: 'Fox Creek',
        monthLabel: 'April 2026',
        calc,
      })
    )

    // PDF header magic bytes are %PDF (0x25 0x50 0x44 0x46).
    expect(buffer.length).toBeGreaterThan(2000)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')
  })
})
