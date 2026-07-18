import { describe, it, expect } from 'vitest'
import { isPremiumActive, isEarlyAccess } from './subscription'

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

// Early-access promo is dated 2027-01-01 UTC in subscription.ts. Anyone whose
// auth.users.created_at falls before that gets the feature gate for free.
describe('isEarlyAccess', () => {
  it('is false for a missing/nullish created_at (signed-out or empty)', () => {
    expect(isEarlyAccess(null)).toBe(false)
    expect(isEarlyAccess(undefined)).toBe(false)
    expect(isEarlyAccess('')).toBe(false)
  })

  it('is true for a user registered before the cutoff', () => {
    expect(isEarlyAccess('2026-06-01T00:00:00Z')).toBe(true)
  })

  it('is false for a user registered after the cutoff', () => {
    expect(isEarlyAccess('2027-06-01T00:00:00Z')).toBe(false)
  })

  it('is false exactly at the cutoff moment (strictly before)', () => {
    expect(isEarlyAccess('2027-01-01T00:00:00Z')).toBe(false)
  })
})
