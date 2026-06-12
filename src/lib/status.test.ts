import { describe, it, expect } from 'vitest'
import { STATUS_OPTIONS, getStatusColor, getStatusIcon, RATING_COLORS } from './status'

describe('getStatusColor', () => {
  it('returns distinct colors for each known status', () => {
    expect(getStatusColor('planned')).toBe('#4b5563')
    expect(getStatusColor('watching')).toBe('#2563eb')
    expect(getStatusColor('watched')).toBe('#16a34a')
    expect(getStatusColor('dropped')).toBe('#dc2626')
  })

  it('falls back to neutral gray for empty / unknown / nullish', () => {
    expect(getStatusColor('')).toBe('#374151')
    expect(getStatusColor('bogus')).toBe('#374151')
    expect(getStatusColor(null)).toBe('#374151')
    expect(getStatusColor(undefined)).toBe('#374151')
  })
})

describe('getStatusIcon', () => {
  it('maps known statuses to icons', () => {
    expect(getStatusIcon('watched')).toBe('✅')
    expect(getStatusIcon('dropped')).toBe('❌')
  })

  it('returns empty string for unknown status', () => {
    expect(getStatusIcon('bogus')).toBe('')
  })
})

describe('STATUS_OPTIONS', () => {
  it('lists the four statuses in display order', () => {
    expect(STATUS_OPTIONS.map(o => o.value)).toEqual(['planned', 'watching', 'watched', 'dropped'])
  })
})

describe('RATING_COLORS', () => {
  it('covers the full 1–10 scale', () => {
    for (let n = 1; n <= 10; n++) expect(RATING_COLORS[n]).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
