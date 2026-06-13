import { describe, it, expect } from 'vitest'
import { isPremiumActive } from './subscription'

const DAY = 86_400_000

describe('isPremiumActive', () => {
  it('is false for no subscription', () => {
    expect(isPremiumActive(null)).toBe(false)
    expect(isPremiumActive(undefined)).toBe(false)
  })

  it('is false when status is not active', () => {
    expect(isPremiumActive({ status: 'inactive', plan: 'premium', current_period_end: null })).toBe(false)
  })

  it('is true when active with no expiry (manual grant)', () => {
    expect(isPremiumActive({ status: 'active', plan: 'premium', current_period_end: null })).toBe(true)
  })

  it('is true when active and period not yet ended', () => {
    const future = new Date(Date.now() + DAY).toISOString()
    expect(isPremiumActive({ status: 'active', plan: 'premium', current_period_end: future })).toBe(true)
  })

  it('is false when active but period has ended', () => {
    const past = new Date(Date.now() - DAY).toISOString()
    expect(isPremiumActive({ status: 'active', plan: 'premium', current_period_end: past })).toBe(false)
  })
})
