// All JSON calls go through our own /api/tmdb proxy (Cloudflare Function in
// prod, Vite dev-proxy locally) so the TMDB key stays server-side.
const BASE_URL = '/api/tmdb'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300'

export function getPosterUrl(path: string | null): string {
  if (!path) return 'https://via.placeholder.com/300x450?text=No+Poster'
  return IMAGE_BASE + path
}

// Full details (incl. trailers, cast, seasons) in one request. Used with the
// shared query key ['details', type, id, lang] by both MovieModal and MediaCard.
export function fetchMediaDetails(type: 'movie' | 'tv', id: number, lang: string) {
  const langShort = lang.startsWith('ru') ? 'ru' : 'en'
  return fetch(
    `${BASE_URL}/${type}/${id}?language=${lang}` +
    `&append_to_response=videos,credits&include_video_language=${langShort},en`
  ).then(r => r.json())
}

export async function searchMedia(query: string, page = 1) {
  const params = new URLSearchParams({
    query,
    include_adult: 'false',
    language: 'ru-RU',
    page: String(page),
  })
  const response = await fetch(`${BASE_URL}/search/multi?${params.toString()}`)
  if (!response.ok) throw new Error('TMDB API error')
  const data = await response.json()
  const filtered = data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
  return { results: filtered, total_pages: data.total_pages, page: data.page, total_results: data.total_results }
}

// ── Localized title/poster cache ────────────────────────────────────────────
// TMDB has no batch endpoint, so localizing a library means one request per
// item. We cache each result per language (in-memory + localStorage) so that
// repeat visits and language toggles hit the network only for items never seen
// before in that language, instead of re-fetching the whole library every time.

type LocalizedMeta = { title: string; poster_path: string | null }

const LS_PREFIX = 'tmdb_loc_'
const memCache = new Map<string, LocalizedMeta>()

function cacheKey(tmdbId: number | string, type: string, lang: string) {
  return `${type}:${tmdbId}:${lang}`
}

function readCache(key: string): LocalizedMeta | undefined {
  if (memCache.has(key)) return memCache.get(key)
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalizedMeta
      memCache.set(key, parsed)
      return parsed
    }
  } catch { /* ignore quota / parse errors */ }
  return undefined
}

function writeCache(key: string, meta: LocalizedMeta) {
  memCache.set(key, meta)
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(meta)) } catch { /* ignore quota */ }
}

// Returns copies of `items` with localized `title`/`poster_path` for `lang`.
// Cache hits resolve synchronously; only misses produce a network request.
export async function localizeMediaItems(items: any[], lang: string): Promise<any[]> {
  return Promise.all(
    items.map(async item => {
      const tmdbId = item.tmdb_id ?? item.id
      if (!tmdbId) return item

      const type = item.media_type === 'tv' ? 'tv' : 'movie'
      const key = cacheKey(tmdbId, type, lang)

      const cached = readCache(key)
      if (cached) {
        return { ...item, title: cached.title || item.title, poster_path: cached.poster_path ?? item.poster_path }
      }

      try {
        const res = await fetch(`${BASE_URL}/${type}/${tmdbId}?language=${lang}`)
        if (!res.ok) return item
        const data = await res.json()
        const meta: LocalizedMeta = {
          title: data.title || data.name || item.title || '',
          poster_path: data.poster_path ?? item.poster_path ?? null,
        }
        writeCache(key, meta)
        return { ...item, title: meta.title || item.title, poster_path: meta.poster_path ?? item.poster_path }
      } catch {
        return item
      }
    })
  )
}
