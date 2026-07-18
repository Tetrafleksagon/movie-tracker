import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MovieModal } from './MovieModal'
import { StatusSelect } from './StatusSelect'
import { WelcomeTip } from './WelcomeTip'
import { fetchLibraryIds } from '../lib/library'
import { tmdbLangTag, fetchJson } from '../lib/tmdb'

// Soft daily limit on "random pick" for guests — a nudge to register.
const GUEST_RANDOM_LIMIT = 15
const GUEST_RANDOM_KEY = 'mt_guest_random_limit'
const today = () => new Date().toISOString().slice(0, 10)
function guestRandomUsed(): number {
  try {
    const v = JSON.parse(localStorage.getItem(GUEST_RANDOM_KEY) || '{}')
    return v.date === today() ? (v.count || 0) : 0
  } catch { return 0 }
}
function bumpGuestRandom(): number {
  const count = guestRandomUsed() + 1
  try { localStorage.setItem(GUEST_RANDOM_KEY, JSON.stringify({ date: today(), count })) } catch {}
  return count
}

const GENRE_CONFIGS = [
  { id: 28,  key: 'genres.action' },
  { id: 35,  key: 'genres.comedy' },
  { id: 18,  key: 'genres.drama' },
  { id: 27,  key: 'genres.horror' },
  { id: 878, key: 'genres.scifi' },
  { id: 16,  key: 'genres.animation' },
]

type GenreRow = { id: number; key: string; movies: any[] }

function ScrollRow({
  children,
  onEndReached,
  endSlot,
}: {
  children: React.ReactNode
  onEndReached?: () => void
  endSlot?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  // Keep the latest callback in a ref so the scroll listener doesn't need to
  // re-subscribe when the parent re-creates the function.
  const onEndReachedRef = useRef(onEndReached)
  useEffect(() => { onEndReachedRef.current = onEndReached }, [onEndReached])

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    setCanRight(!nearEnd)
    // Trigger a load a bit BEFORE the true end so the next tiles slide in
    // as the user is still scrolling — feels seamless rather than "stopped".
    if (!nearEnd && el.scrollLeft + el.clientWidth >= el.scrollWidth - 400) {
      onEndReachedRef.current?.()
    } else if (nearEnd) {
      onEndReachedRef.current?.()
    }
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [check])

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
      >
        {children}
        {endSlot}
      </div>
      {canLeft && (
        <div
          className="absolute left-0 top-0 bottom-2 w-14 flex items-center justify-center cursor-pointer group"
          style={{ background: 'linear-gradient(to right, #111827 25%, transparent)' }}
          onClick={() => ref.current?.scrollBy({ left: -320, behavior: 'smooth' })}
        >
          <span className="text-white/60 group-hover:text-white/90 text-4xl leading-none select-none transition-colors">‹</span>
        </div>
      )}
      {canRight && (
        <div
          className="absolute right-0 top-0 bottom-2 w-14 flex items-center justify-center cursor-pointer group"
          style={{ background: 'linear-gradient(to left, #111827 25%, transparent)' }}
          onClick={() => ref.current?.scrollBy({ left: 320, behavior: 'smooth' })}
        >
          <span className="text-white/60 group-hover:text-white/90 text-4xl leading-none select-none transition-colors">›</span>
        </div>
      )}
    </div>
  )
}

type InfiniteRowProps = {
  initialItems: any[]
  // Fetches page N (1-based); the caller wires TMDB URLs. Returns the raw
  // items — filtering happens here so we can keep loading if a page turns
  // out to be mostly library items.
  fetchPage: (page: number) => Promise<any[]>
  // Client-side filter (usually `notInLibrary`). Empty pages after filtering
  // still count against the page counter but keep the loader trying.
  filter: (item: any) => boolean
  renderItem: (item: any) => React.ReactNode
  // How many pages were baked into `initialItems`. The row will start
  // fetching from `initialPages + 1`.
  initialPages?: number
  // Safety cap so a runaway scroll can't hammer TMDB. TMDB /discover tops
  // out around page 500; picking a lower ceiling is plenty for a row UI.
  maxPages?: number
}

// Wraps a ScrollRow with cursor-based load-more: when the user scrolls near
// the right edge, we fetch the next page and append. Dedup by id so React
// keys stay unique even if TMDB returns overlaps between pages.
function InfiniteRow({
  initialItems,
  fetchPage,
  filter,
  renderItem,
  initialPages = 1,
  maxPages = 15,
}: InfiniteRowProps) {
  const { t } = useTranslation()
  // TMDB can return the same title on adjacent pages (a popular film that
  // moves between page 1 and page 2 of `trending` while we fetch both),
  // so dedup on the way in — otherwise React warns about duplicate keys.
  const dedupById = useCallback((arr: any[]) => {
    const seen = new Set<any>()
    const out: any[] = []
    for (const x of arr) { if (!seen.has(x.id)) { seen.add(x.id); out.push(x) } }
    return out
  }, [])
  const [items, setItems] = useState<any[]>(() => dedupById(initialItems))
  const [nextPage, setNextPage] = useState(initialPages + 1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Reset when initial data actually changes (language switch → new query).
  useEffect(() => {
    setItems(dedupById(initialItems))
    setNextPage(initialPages + 1)
    setLoading(false)
    setDone(false)
  }, [initialItems, initialPages, dedupById])

  const loadingRef = useRef(false)
  const loadMore = useCallback(async () => {
    if (loadingRef.current || done) return
    if (nextPage > maxPages) { setDone(true); return }
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh = await fetchPage(nextPage)
      if (!fresh.length) { setDone(true); return }
      setItems(prev => {
        const seen = new Set(prev.map((x: any) => x.id))
        const add = fresh.filter((x: any) => !seen.has(x.id))
        return add.length ? [...prev, ...add] : prev
      })
      setNextPage(p => p + 1)
    } catch (e) {
      console.error('InfiniteRow fetch error:', e)
      setDone(true)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [nextPage, done, maxPages, fetchPage])

  const filtered = items.filter(filter)

  return (
    <ScrollRow
      onEndReached={loadMore}
      endSlot={
        loading ? (
          <div className="flex-shrink-0 w-40 h-52 bg-gray-800/60 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-500 animate-pulse">{t('common.loading')}</span>
          </div>
        ) : null
      }
    >
      {filtered.map(renderItem)}
    </ScrollRow>
  )
}

type CardTileProps = {
  item: any
  status: string
  onStatus: (s: string) => void
  onClick: () => void
}

function CardTile({ item, status, onStatus, onClick }: CardTileProps) {
  return (
    <div
      className="flex-shrink-0 w-40 bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl hover:scale-[1.03] transition-all cursor-pointer flex flex-col"
      onClick={onClick}
    >
      {item.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
          alt={item.title || item.name}
          className="w-full h-52 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-52 bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 text-xs text-center px-1">{item.title || item.name}</span>
        </div>
      )}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
        <h3 className="text-xs font-semibold leading-tight line-clamp-2">
          {item.title || item.name}
        </h3>
        {item.overview && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-4 flex-1">
            {item.overview}
          </p>
        )}
        <StatusSelect
          value={status}
          onStatus={onStatus}
          className="w-full py-1 px-1 rounded text-xs text-white font-medium cursor-pointer border-none focus:outline-none mt-auto"
        />
      </div>
    </div>
  )
}

export function Search() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const tmdbLang = tmdbLangTag(i18n.language)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)

  // Home state
  const [randomPick, setRandomPick] = useState<any | null>(null)
  const [randomLoading, setRandomLoading] = useState(false)
  const [isGuest, setIsGuest] = useState(true)
  const [guestLimited, setGuestLimited] = useState(false)

  // Shared
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const seenRandomRef = useRef<Set<number>>(new Set())

  // Click-outside handler — only once
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Track auth state for the guest random-pick limit.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsGuest(!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setIsGuest(!session?.user))
    return () => subscription.unsubscribe()
  }, [])

  // Reset the random pick when the language changes (its texts are stale).
  useEffect(() => {
    setRandomPick(null)
  }, [i18n.language])

  // Home data (trending + genre rows), cached per language by React Query.
  const { data: homeData, isLoading: homeLoading } = useQuery({
    queryKey: ['home', tmdbLang],
    queryFn: async () => {
      // Two pages per row so there's still plenty left after excluding the
      // user's library. Edge-cached, so the extra calls hit TMDB at most once
      // per hour across all visitors.
      const [trendingPages, genreData] = await Promise.all([
        Promise.all([1, 2].map(p =>
          fetchJson(`/api/tmdb/trending/all/week?language=${tmdbLang}&page=${p}`)
        )),
        Promise.all(GENRE_CONFIGS.map(async g => {
          const pages = await Promise.all([1, 2].map(p =>
            fetchJson(`/api/tmdb/discover/movie?with_genres=${g.id}&sort_by=vote_average.desc&vote_count.gte=500&page=${p}&language=${tmdbLang}`)
          ))
          // Both fetched pages go into the row — after excluding the user's
          // library a 20-item cap left the rows too short.
          return { ...g, movies: pages.flatMap((d: any) => d.results || []) }
        })),
      ])
      return {
        trending: trendingPages
          .flatMap((d: any) => d.results || [])
          .filter((i: any) => i.media_type !== 'person'),
        genres: genreData as GenreRow[],
      }
    },
  })
  const trending: any[] = homeData?.trending ?? []
  const genres: GenreRow[] = homeData?.genres ?? []

  // Titles already in the user's library are excluded from recommendations and
  // the random pool (signed-out users see everything).
  const { data: libraryIds } = useQuery({ queryKey: ['library-ids'], queryFn: fetchLibraryIds })
  const libSet = libraryIds instanceof Set ? libraryIds : null
  const notInLibrary = (item: any) => !(libSet && libSet.has(item.id))

  // A pool of popular movies fetched once per language (cached forever for the
  // session), then randomized on the client — so repeated "random" clicks cost
  // no TMDB calls and can't be used to hammer the proxy.
  const pickRandom = async () => {
    // Guests get a limited number of random picks per day, then a register CTA.
    if (isGuest && guestRandomUsed() >= GUEST_RANDOM_LIMIT) {
      setGuestLimited(true)
      return
    }
    setRandomLoading(true)
    try {
      const pool: any[] = await queryClient.fetchQuery({
        queryKey: ['random-pool', tmdbLang],
        staleTime: Infinity,
        queryFn: async () => {
          // 8 random pages out of the top 150 (instead of a fixed 1-8): a
          // different ~160-movie pool each session, so picks don't repeat
          // the same handful of blockbusters.
          const pages = new Set<number>()
          while (pages.size < 8) pages.add(1 + Math.floor(Math.random() * 150))
          const data = await Promise.all([...pages].map(p =>
            fetchJson(`/api/tmdb/discover/movie?language=${tmdbLang}&sort_by=popularity.desc&vote_count.gte=100&page=${p}`)
          ))
          return data.flatMap((d: any) => d.results || []).filter((m: any) => m.poster_path && m.backdrop_path)
        },
      })
      // Don't repeat anything already shown this session. The exhaust check
      // must consider the LIBRARY-filtered pool, not the raw pool — otherwise
      // a user whose library covers most of the pool gets stuck: `seen`
      // fills up but never crosses the raw threshold, so no candidates remain.
      let candidates = pool.filter(m => !seenRandomRef.current.has(m.id) && notInLibrary(m))
      if (candidates.length === 0) {
        seenRandomRef.current.clear()
        candidates = pool.filter(notInLibrary)
      }
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)]
        seenRandomRef.current.add(pick.id)
        setRandomPick(pick)
        if (isGuest) bumpGuestRandom()
      }
    } catch (e) {
      console.error('Random pick error:', e)
    }
    setRandomLoading(false)
  }

  const showToast = useCallback((message: string, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, error })
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const addToLibrary = useCallback(async (item: any, status: string) => {
    setItemStatuses(prev => ({ ...prev, [item.id]: status }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast(t('common.please_login'), true)
      setItemStatuses(prev => { const next = { ...prev }; delete next[item.id]; return next })
      return
    }

    const title = item.title || item.name
    const now = new Date().toISOString()

    const { error: cacheError } = await supabase.from('media_cache').upsert({
      tmdb_id: item.id,
      media_type: item.media_type || 'movie',
      title,
      poster_path: item.poster_path,
      vote_average: item.vote_average || 0,
      release_date: item.release_date || item.first_air_date,
    }, { onConflict: 'tmdb_id' })

    if (cacheError) console.error('Cache error:', cacheError)

    const { error } = await supabase.from('user_media').upsert({
      user_id: user.id,
      tmdb_id: item.id,
      status,
      updated_at: now,
      status_history: [{ status, time: now }],
    }, { onConflict: 'user_id,tmdb_id' })

    if (error) {
      console.error('Error adding to library:', error)
      showToast(t('common.error'), true)
      setItemStatuses(prev => { const next = { ...prev }; delete next[item.id]; return next })
    } else {
      showToast('✓ ' + title)
      // Library/Stats caches are stale after the upsert.
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['library-ids'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  }, [showToast, t, queryClient])

  const fetchSuggestions = async (q: string) => {
    try {
      const data = await fetchJson(
        `/api/tmdb/search/multi?language=${tmdbLang}&query=${encodeURIComponent(q)}`
      )
      const items = (data.results || []).filter((i: any) => i.media_type !== 'person').slice(0, 7)
      setSuggestions(items)
      setShowSuggestions(items.length > 0)
    } catch {}
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceTimer.current = setTimeout(() => fetchSuggestions(value), 350)
  }

  const selectSuggestion = (item: any) => {
    const title = item.title || item.name
    setQuery(title)
    setResults(suggestions.filter(s => (s.title || s.name) === title))
    setIsSearchMode(true)
    setShowSuggestions(false)
    setSuggestions([])
    setItemStatuses({})
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setIsSearchMode(false)
      setResults([])
      return
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setShowSuggestions(false)
    setLoading(true)
    setIsSearchMode(true)
    setItemStatuses({})
    try {
      const data = await fetchJson(
        `/api/tmdb/search/multi?language=${tmdbLang}&query=${encodeURIComponent(query)}`
      )
      setResults(data.results || [])
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsSearchMode(false)
    setSuggestions([])
    setShowSuggestions(false)
    setItemStatuses({})
  }

  return (
    <main className="max-w-6xl mx-auto p-4">

      {toast && (
        <div
          onClick={() => setToast(null)}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg cursor-pointer select-none ${
            toast.error ? 'bg-red-600' : 'bg-green-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {selectedItem && (
        <MovieModal
          item={selectedItem}
          status={itemStatuses[selectedItem.id] || ''}
          lang={tmdbLang}
          onStatus={s => addToLibrary(selectedItem, s)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div ref={searchWrapperRef} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="search-input"
                type="text"
                placeholder={t('search.placeholder')}
                value={query}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full p-3 pr-9 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={t('common.clear')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none"
                  tabIndex={-1}
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded font-medium transition"
            >
              {loading ? t('common.loading') : t('header.search')}
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
              {suggestions.map(item => {
                const title = item.title || item.name
                const originalTitle = item.original_title || item.original_name
                const year = (item.release_date || item.first_air_date || '').split('-')[0]
                const rating = item.vote_average > 0 ? item.vote_average.toFixed(2) : null
                return (
                  <div
                    key={item.id}
                    onMouseDown={e => { e.preventDefault(); selectSuggestion(item) }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {originalTitle !== title && originalTitle}
                        {originalTitle !== title && year && ', '}
                        {year}
                      </p>
                    </div>
                    {rating && (
                      <span className="text-sm text-yellow-400 ml-4 flex-shrink-0 tabular-nums">{rating}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </form>

      {/* ── SEARCH RESULTS ── */}
      {isSearchMode ? (
        <>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition cursor-pointer" onClick={() => setSelectedItem(item)}>
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-2 truncate">{item.title || item.name}</h3>
                    <StatusSelect
                      value={itemStatuses[item.id] || ''}
                      onStatus={s => addToLibrary(item, s)}
                      className="w-full py-1.5 px-2 rounded text-sm text-white font-medium cursor-pointer border-none focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <p className="text-center text-gray-400 mt-8">{t('search.no_results')}</p>
          )}
        </>
      ) : (
        /* ── HOME CONTENT ── */
        <div className="space-y-10">

          <WelcomeTip />

          {/* Random movie */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-100">{t('search.random_title')}</h2>
              <button
                onClick={pickRandom}
                disabled={randomLoading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-60 rounded-lg text-sm font-semibold transition min-w-[120px] text-center"
              >
                {randomLoading ? '...' : t('search.random_btn')}
              </button>
            </div>

            {guestLimited ? (
              <div className="text-center py-7 px-4 border border-dashed border-indigo-500/40 rounded-xl bg-indigo-900/10">
                <div className="text-3xl mb-2">🎬</div>
                <p className="text-gray-200 font-medium mb-4 max-w-sm mx-auto leading-relaxed">{t('search.guest_limit')}</p>
                <div className="flex items-center justify-center gap-2">
                  <Link to="/library" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">{t('auth.sign_in')}</Link>
                  <Link to="/library" className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition">{t('auth.sign_up')}</Link>
                </div>
              </div>
            ) : randomPick ? (
              <div
                className="relative rounded-xl overflow-hidden border border-indigo-500/60 shadow-xl cursor-pointer"
                onClick={() => setSelectedItem(randomPick)}
                title={t('search.random_label')}
              >
                <div className="h-64 sm:h-80 lg:h-[28rem] relative">
                  {randomPick.backdrop_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w1280${randomPick.backdrop_path}`}
                      alt={randomPick.title || randomPick.name}
                      className="w-full h-full object-cover object-[center_30%]"
                    />
                  ) : randomPick.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${randomPick.poster_path}`}
                      alt={randomPick.title || randomPick.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-indigo-300 font-semibold mb-1">🎲 {t('search.random_label')}</p>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {randomPick.title || randomPick.name}
                    </h3>
                    <p className="text-sm text-gray-300 mt-0.5">
                      {(randomPick.release_date || randomPick.first_air_date || '').split('-')[0]}
                      {randomPick.vote_average > 0 && ` · ⭐ ${randomPick.vote_average.toFixed(1)}`}
                    </p>
                    {randomPick.overview && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-4 max-w-lg leading-relaxed">
                        {randomPick.overview}
                      </p>
                    )}
                  </div>
                  <StatusSelect
                    value={itemStatuses[randomPick.id] || ''}
                    onStatus={s => addToLibrary(randomPick, s)}
                    className="flex-shrink-0 py-2 px-3 rounded-lg text-sm text-white font-medium cursor-pointer border-none focus:outline-none"
                  />
                </div>
              </div>
            ) : !homeLoading && (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-700 rounded-xl">
                {t('search.random_hint')}
              </p>
            )}
          </section>

          {/* Trending */}
          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-3">{t('search.trending')}</h2>
            {homeLoading ? (
              <p className="text-sm text-gray-500">{t('common.loading')}</p>
            ) : (
              <InfiniteRow
                initialItems={trending}
                initialPages={2}
                filter={notInLibrary}
                fetchPage={async page => {
                  const data = await fetchJson(`/api/tmdb/trending/all/week?language=${tmdbLang}&page=${page}`)
                  return (data.results || []).filter((i: any) => i.media_type !== 'person')
                }}
                renderItem={item => (
                  <CardTile
                    key={item.id}
                    item={item}
                    status={itemStatuses[item.id] || ''}
                    onStatus={s => addToLibrary(item, s)}
                    onClick={() => setSelectedItem(item)}
                  />
                )}
              />
            )}
          </section>

          {/* Genre rows */}
          {!homeLoading && genres.map(genre => {
            // Hide a genre only if we couldn't show anything on first paint
            // (all first-two-page picks are already in the library). Once
            // the row appears, InfiniteRow can still discover more via
            // subsequent pages as the user scrolls.
            if (genre.movies.filter(notInLibrary).length === 0) return null
            return (
              <section key={genre.id}>
                <h2 className="text-lg font-bold text-gray-100 mb-3">{t(genre.key)}</h2>
                <InfiniteRow
                  initialItems={genre.movies}
                  initialPages={2}
                  filter={notInLibrary}
                  fetchPage={async page => {
                    const data = await fetchJson(
                      `/api/tmdb/discover/movie?with_genres=${genre.id}&sort_by=vote_average.desc&vote_count.gte=500&page=${page}&language=${tmdbLang}`
                    )
                    return data.results || []
                  }}
                  renderItem={item => (
                    <CardTile
                      key={item.id}
                      item={item}
                      status={itemStatuses[item.id] || ''}
                      onStatus={s => addToLibrary(item, s)}
                      onClick={() => setSelectedItem(item)}
                    />
                  )}
                />
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
