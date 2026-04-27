/**
 * Legal compliance tests — validate that key disclaimers and source attributions
 * are present in the source files. These are static analysis tests that catch
 * accidental removal of legal protective language during refactors.
 *
 * These tests read the source files directly (no rendering) because the goal
 * is to ensure the text exists in the codebase, regardless of render conditions.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')
const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf-8')
const BARTER = fs.readFileSync(path.join(ROOT, 'src/components/BarterPage.tsx'), 'utf-8')

describe('Homepage (page.tsx) — legal compliance', () => {
  it('has legal review comment at top', () => {
    expect(PAGE).toContain('Legal note: All competitor references are based on publicly available data')
  })

  it('attributes $94,500 claim to NGCOA and Golf Inc.', () => {
    expect(PAGE).toContain('NGCOA member survey data and Golf Inc. industry analysis')
  })

  it('has $94,500 footnote disclaimer near the figure', () => {
    expect(PAGE).toContain('Based on 2 barter tee times/day at average rack rates across NGCOA member survey')
  })

  it('attributes pull-quote to Neil Barris by name', () => {
    expect(PAGE).toContain('Neil Barris, Co-Founder, TeeAhead')
  })

  it('comparison table removed — source notes moved to stat section', () => {
    // Comparison table was intentionally removed in redesign (April 2026).
    // Source attributions are now in the stat moment section footnote.
    expect(PAGE).toContain('NGCOA member survey data and Golf Inc. industry analysis')
  })

  it('attributes Windsor Parke exodus stat to Golf Inc.', () => {
    expect(PAGE).toContain('Golf Inc. / industry reporting, Windsor Parke case study')
  })

  it('attributes NGCOA exodus stat to NGCOA Q1 2025', () => {
    expect(PAGE).toContain('National Golf Course Owners Association (NGCOA), Q1 2025')
  })

  it('attributes $94,500 exodus stat to NGCOA & Golf Inc.', () => {
    expect(PAGE).toContain('NGCOA member survey data & Golf Inc. industry analysis, 2024')
  })

  it('has not-affiliated disclaimer in source', () => {
    // Footer disclaimer intentionally removed in redesign (April 2026); preserved in stat section footnote.
    expect(PAGE).toContain('not affiliated with or endorsed by GolfNow or NBC Sports Next')
  })

  it('does not use "extract value" without attribution', () => {
    // "extract value" was replaced with "barter model cost" — ensure the old phrase is gone
    expect(PAGE).not.toContain('extract value from the courses')
  })

  it('does not contain unsourced superlatives (predatory, scam, steal)', () => {
    expect(PAGE).not.toMatch(/\bpredatory\b/i)
    expect(PAGE).not.toMatch(/\bscam\b/i)
    expect(PAGE).not.toMatch(/\bsteal\b/i)
  })
})

describe('Barter page (BarterPage.tsx) — legal compliance', () => {
  it('has legal review comment at top', () => {
    expect(BARTER).toContain('Legal note: All competitor references are based on publicly available data')
  })

  it('has calculator disclaimer text', () => {
    expect(BARTER).toContain('Calculation based on GolfNow')
    expect(BARTER).toContain('Actual barter arrangements vary by course agreement')
  })

  it('has hero source footnote', () => {
    expect(BARTER).toContain('NGCOA member survey data and Golf Inc. industry analysis')
  })

  it('attributes Windsor Parke to Golf Inc.', () => {
    expect(BARTER).toContain('Golf Inc. / industry reporting, Windsor Parke case study')
  })

  it('attributes Brown Golf to NGCOA', () => {
    expect(BARTER).toContain('NGCOA member reporting / Golf Inc. analysis')
  })

  it('attributes 100+ exodus to NGCOA Q1 2025', () => {
    expect(BARTER).toContain('National Golf Course Owners Association (NGCOA), Q1 2025')
  })

  it('has not-affiliated footer disclaimer', () => {
    expect(BARTER).toContain('not affiliated with or endorsed by GolfNow or NBC Sports Next')
  })

  it('does not use "extracted" in hero subhead', () => {
    // Was replaced with "cost" to soften unsourced emotional framing
    expect(BARTER).not.toContain('GolfNow\'s barter model has extracted')
  })

  it('does not contain unsourced superlatives', () => {
    expect(BARTER).not.toMatch(/\bpredatory\b/i)
    expect(BARTER).not.toMatch(/\bscam\b/i)
    expect(BARTER).not.toMatch(/\bsteal\b/i)
  })

  it('operating days slider minimum is 100, not 150', () => {
    expect(BARTER).toContain('min={100}')
    expect(BARTER).not.toContain('min={150}')
  })
})
