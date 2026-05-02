import { describe, it, expect } from 'vitest'
import { SIDEBAR_NAV_ITEMS, BOTTOM_NAV_ITEMS, isNavItemActive } from '@/lib/nav'

describe('SIDEBAR_NAV_ITEMS', () => {
  it('has 8 items', () => {
    expect(SIDEBAR_NAV_ITEMS).toHaveLength(8)
  })
  it('first item is Dashboard with href /app and exact true', () => {
    expect(SIDEBAR_NAV_ITEMS[0]).toEqual({ href: '/app', label: 'Dashboard', icon: '⛳', exact: true })
  })
})

describe('BOTTOM_NAV_ITEMS', () => {
  it('has 5 items', () => {
    expect(BOTTOM_NAV_ITEMS).toHaveLength(5)
  })
  it('does not include My Card', () => {
    expect(BOTTOM_NAV_ITEMS.every(item => item.label !== 'My Card')).toBe(true)
  })
})

describe('isNavItemActive', () => {
  it('exact match: active when pathname === href', () => {
    expect(isNavItemActive('/app', '/app', true)).toBe(true)
  })
  it('exact match: inactive when pathname is /app/courses', () => {
    expect(isNavItemActive('/app/courses', '/app', true)).toBe(false)
  })
  it('prefix match: active when pathname starts with href', () => {
    expect(isNavItemActive('/app/courses', '/app/courses', false)).toBe(true)
  })
  it('prefix match: active on sub-path', () => {
    expect(isNavItemActive('/app/courses/123', '/app/courses', false)).toBe(true)
  })
})
