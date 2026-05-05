import { describe, it, expectTypeOf } from 'vitest'
import type { PartnerPreferences, PartnerRating, PlayStyle, Gender, OpenTo } from '@/types/partners'

describe('partner types', () => {
  it('PartnerPreferences includes v2 fields', () => {
    expectTypeOf<PartnerPreferences>().toHaveProperty('play_style')
    expectTypeOf<PartnerPreferences>().toHaveProperty('gender')
    expectTypeOf<PartnerPreferences>().toHaveProperty('open_to')
  })

  it('PlayStyle values are correct', () => {
    const valid: PlayStyle[] = ['casual', 'moderate', 'competitive']
    expectTypeOf(valid[0]).toEqualTypeOf<PlayStyle>()
  })

  it('PartnerRating has required fields', () => {
    expectTypeOf<PartnerRating>().toHaveProperty('stars')
    expectTypeOf<PartnerRating>().toHaveProperty('connection_request_id')
    expectTypeOf<PartnerRating>().toHaveProperty('rater_id')
  })
})
