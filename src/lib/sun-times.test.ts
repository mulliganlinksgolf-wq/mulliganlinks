import { describe, it, expect } from 'vitest'
import { computeSunTimes } from './sun-times'

// Fox Creek Golf Course, Livonia MI: 42.4267, -83.3838
const livonia = { latitude: 42.4267, longitude: -83.3838 }

describe('computeSunTimes', () => {
  it('returns sunrise before firstBookable when offset is positive', () => {
    const result = computeSunTimes({
      date: new Date('2026-06-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    expect(result.firstBookable.getTime()).toBeGreaterThan(result.sunrise.getTime())
  })

  it('returns lastBookable before sunset when offset is negative', () => {
    const result = computeSunTimes({
      date: new Date('2026-06-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    expect(result.lastBookable.getTime()).toBeLessThan(result.sunset.getTime())
  })

  it('rounds firstBookable and lastBookable to the nearest 10 minutes', () => {
    const result = computeSunTimes({
      date: new Date('2026-06-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    expect(result.firstBookable.getMinutes() % 10).toBe(0)
    expect(result.lastBookable.getMinutes() % 10).toBe(0)
    expect(result.firstBookable.getSeconds()).toBe(0)
    expect(result.firstBookable.getMilliseconds()).toBe(0)
  })

  it('produces a longer bookable window in summer than winter', () => {
    const summer = computeSunTimes({
      date: new Date('2026-06-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    const winter = computeSunTimes({
      date: new Date('2026-12-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    const summerWindow = summer.lastBookable.getTime() - summer.firstBookable.getTime()
    const winterWindow = winter.lastBookable.getTime() - winter.firstBookable.getTime()
    expect(summerWindow).toBeGreaterThan(winterWindow)
  })

  it('puts the Livonia summer first tee in the morning Eastern Time', () => {
    const result = computeSunTimes({
      date: new Date('2026-06-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    const hourET = Number(
      result.firstBookable.toLocaleString('en-US', {
        timeZone: 'America/Detroit',
        hour: 'numeric',
        hour12: false,
      })
    )
    expect(hourET).toBeGreaterThanOrEqual(5)
    expect(hourET).toBeLessThanOrEqual(8)
  })

  it('puts the Livonia summer last tee in the evening Eastern Time', () => {
    const result = computeSunTimes({
      date: new Date('2026-06-21T12:00:00Z'),
      ...livonia,
      sunriseOffsetMinutes: 30,
      sunsetOffsetMinutes: -90,
    })
    const hourET = Number(
      result.lastBookable.toLocaleString('en-US', {
        timeZone: 'America/Detroit',
        hour: 'numeric',
        hour12: false,
      })
    )
    expect(hourET).toBeGreaterThanOrEqual(18)
    expect(hourET).toBeLessThanOrEqual(20)
  })
})
