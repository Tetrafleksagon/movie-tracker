import { describe, it, expect, vi, afterEach } from 'vitest'
import { tmdbLangTag, shortLang, getPosterUrl, fetchJson } from './tmdb'

describe('tmdbLangTag', () => {
  it('maps ui uk → uk-UA', () => {
    expect(tmdbLangTag('uk')).toBe('uk-UA')
    expect(tmdbLangTag('uk-UA')).toBe('uk-UA')
  })

  it('maps ui ru → ru-RU', () => {
    expect(tmdbLangTag('ru')).toBe('ru-RU')
    expect(tmdbLangTag('ru-RU')).toBe('ru-RU')
  })

  it('falls back to en-US for anything else', () => {
    expect(tmdbLangTag('en')).toBe('en-US')
    expect(tmdbLangTag('en-GB')).toBe('en-US')
    expect(tmdbLangTag('fr')).toBe('en-US')
    expect(tmdbLangTag('')).toBe('en-US')
  })
})

describe('shortLang', () => {
  it('collapses UI + TMDB tags to the ISO-639-1 pair we use', () => {
    expect(shortLang('uk')).toBe('uk')
    expect(shortLang('uk-UA')).toBe('uk')
    expect(shortLang('ru')).toBe('ru')
    expect(shortLang('ru-RU')).toBe('ru')
    expect(shortLang('en')).toBe('en')
    expect(shortLang('en-US')).toBe('en')
    // Anything unknown falls back to English — the safe default.
    expect(shortLang('fr')).toBe('en')
  })
})

describe('getPosterUrl', () => {
  it('builds a TMDB w300 URL from a path', () => {
    expect(getPosterUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w300/abc.jpg')
  })

  it('returns a placeholder for a missing path', () => {
    // Any non-empty placeholder is fine; make sure we don't return "undefined"
    // or a broken TMDB URL for null.
    const url = getPosterUrl(null)
    expect(url).toMatch(/^https?:\/\//)
    expect(url).not.toContain('null')
  })
})

describe('fetchJson', () => {
  const realFetch = globalThis.fetch
  afterEach(() => { globalThis.fetch = realFetch })

  it('returns parsed JSON on 2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: 'world' }),
    }) as any
    await expect(fetchJson('/x')).resolves.toEqual({ hello: 'world' })
  })

  it('throws on non-ok — surfacing the status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }) as any
    await expect(fetchJson('/x')).rejects.toThrow(/500/)
  })
})
