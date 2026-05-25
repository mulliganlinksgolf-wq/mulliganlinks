import { describe, it, expect } from 'vitest'
import { joinFirstNames, parseFirstName } from './pairing-notifications'

describe('joinFirstNames', () => {
  it('handles a single other player', () => {
    expect(joinFirstNames(['Alice'])).toBe('Alice')
  })
  it('handles two players with "and"', () => {
    expect(joinFirstNames(['Alice', 'Bob'])).toBe('Alice and Bob')
  })
  it('handles three players with Oxford comma', () => {
    expect(joinFirstNames(['Alice', 'Bob', 'Carol'])).toBe('Alice, Bob, and Carol')
  })
  it('handles an empty list', () => {
    expect(joinFirstNames([])).toBe('')
  })
})

describe('parseFirstName', () => {
  it('returns first token of full name', () => {
    expect(parseFirstName('Neil Barris')).toBe('Neil')
  })
  it('handles single-word names', () => {
    expect(parseFirstName('Madonna')).toBe('Madonna')
  })
  it('trims whitespace', () => {
    expect(parseFirstName('  Neil Barris  ')).toBe('Neil')
  })
  it('returns empty for empty input', () => {
    expect(parseFirstName('')).toBe('')
    expect(parseFirstName(null as any)).toBe('')
    expect(parseFirstName(undefined as any)).toBe('')
  })
})
