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
const SCORECARD = fs.readFileSync(path.join(ROOT, 'src/components/FoundersScorecard.tsx'), 'utf-8')
const BARTER = fs.readFileSync(path.join(ROOT, 'src/components/BarterPage.tsx'), 'utf-8').replace(/\s+/g, ' ')

describe('Homepage — launch and marketing claims', () => {
  it('does not reintroduce removed competitor loss claims without review', () => {
    expect(PAGE).not.toMatch(/GolfNow|94,500|48,000|382%|39\.6%|Windsor Parke/)
  })

  it('makes the prelaunch status and free waitlist clear', () => {
    expect(PAGE).toContain('Not yet.')
    expect(PAGE).toContain('launch timing are confirmed')
    expect(PAGE).toContain('no payment details required')
  })

  it('labels product imagery as sample data', () => {
    expect(PAGE).toContain('Product preview · Sample data')
  })

  it('preserves founder attribution in the founding scorecard', () => {
    expect(SCORECARD).toContain('Neil Barris')
  })

  it('does not contain unsupported accusations', () => {
    expect(PAGE).not.toMatch(/\b(predatory|scam|steal)\b/i)
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
    expect(BARTER).toContain('<SiteFooter')
    expect(fs.readFileSync(path.join(ROOT, 'src/components/SiteFooter.tsx'), 'utf-8').replace(/\s+/g, ' ')).toContain('not affiliated with or endorsed by GolfNow or NBC Sports Next')
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

describe('Waitlist does not attribute paid referrals', () => {
  const form = fs.readFileSync(path.join(ROOT, 'src/app/waitlist/golfer/GolferWaitlistForm.tsx'), 'utf-8')
  const action = fs.readFileSync(path.join(ROOT, 'src/app/waitlist/golfer/actions.ts'), 'utf-8')

  it('collects launch interest without a home-course referral selector', () => {
    expect(form).not.toContain('name="referring_course_id"')
    expect(form).toContain('No payment or membership commitment is needed')
  })

  it('does not assign a revenue-share referral when joining the waitlist', () => {
    expect(action).not.toContain("from('course_referrals')")
    expect(action).not.toContain('referring_course_id')
  })
})
