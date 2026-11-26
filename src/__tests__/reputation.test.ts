import { getReputationTier } from '../services/reputation.js'

describe('getReputationTier', () => {
  it('returns Newcomer for low reputation', () => {
    expect(getReputationTier(0)).toBe('Newcomer')
    expect(getReputationTier(29)).toBe('Newcomer')
  })

  it('returns Reliable at 30+', () => {
    expect(getReputationTier(30)).toBe('Reliable')
    expect(getReputationTier(99)).toBe('Reliable')
  })

  it('returns Experienced at 100+', () => {
    expect(getReputationTier(100)).toBe('Experienced')
  })

  it('returns Expert at 200+', () => {
    expect(getReputationTier(200)).toBe('Expert')
  })

  it('returns Master at 500+', () => {
    expect(getReputationTier(500)).toBe('Master')
    expect(getReputationTier(1000)).toBe('Master')
  })
})
