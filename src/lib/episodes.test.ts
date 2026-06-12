import { describe, it, expect } from 'vitest'
import {
  epKey, realSeasons, totalEpisodeCount, nextUnwatched, statusAfterProgress,
  type SeasonInfo,
} from './episodes'

const seasons: SeasonInfo[] = [
  { season_number: 1, episode_count: 2 },
  { season_number: 2, episode_count: 1 },
]

describe('realSeasons', () => {
  it('drops specials (season 0) and empty seasons', () => {
    const input: SeasonInfo[] = [
      { season_number: 0, episode_count: 5 },   // specials
      { season_number: 1, episode_count: 10 },
      { season_number: 2, episode_count: 0 },    // unaired / empty
    ]
    expect(realSeasons(input).map(s => s.season_number)).toEqual([1])
  })

  it('handles null/undefined input', () => {
    expect(realSeasons(null)).toEqual([])
    expect(realSeasons(undefined)).toEqual([])
  })
})

describe('totalEpisodeCount', () => {
  it('sums episode counts', () => {
    expect(totalEpisodeCount(seasons)).toBe(3)
  })
})

describe('nextUnwatched', () => {
  it('returns the very first episode when nothing is watched', () => {
    expect(nextUnwatched(seasons, new Set())).toEqual({ season: 1, episode: 1 })
  })

  it('advances within a season', () => {
    expect(nextUnwatched(seasons, new Set([epKey(1, 1)]))).toEqual({ season: 1, episode: 2 })
  })

  it('crosses into the next season', () => {
    const watched = new Set([epKey(1, 1), epKey(1, 2)])
    expect(nextUnwatched(seasons, watched)).toEqual({ season: 2, episode: 1 })
  })

  it('returns null once everything is watched', () => {
    const watched = new Set([epKey(1, 1), epKey(1, 2), epKey(2, 1)])
    expect(nextUnwatched(seasons, watched)).toBeNull()
  })
})

describe('statusAfterProgress', () => {
  it('does nothing at zero progress', () => {
    expect(statusAfterProgress(0, 10, '')).toBeNull()
  })

  it('moves to "watching" on first episode from a fresh/planned show', () => {
    expect(statusAfterProgress(1, 10, '')).toBe('watching')
    expect(statusAfterProgress(1, 10, 'planned')).toBe('watching')
  })

  it('leaves an already-watching show alone', () => {
    expect(statusAfterProgress(3, 10, 'watching')).toBeNull()
  })

  it('downgrades a "watched" show back to "watching" when not complete', () => {
    expect(statusAfterProgress(3, 10, 'watched')).toBe('watching')
  })

  it('marks "watched" once all episodes are done', () => {
    expect(statusAfterProgress(10, 10, 'watching')).toBe('watched')
  })

  it('does not re-mark an already-watched complete show', () => {
    expect(statusAfterProgress(10, 10, 'watched')).toBeNull()
  })

  it('ignores shows with unknown episode total', () => {
    expect(statusAfterProgress(0, 0, '')).toBeNull()
  })
})
