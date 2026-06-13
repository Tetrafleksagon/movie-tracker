import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MovieModal } from './MovieModal'
import { StatusSelect } from './StatusSelect'
import { WelcomeTip } from './WelcomeTip'
import { fetchLibraryIds } from '../lib/library'

const GENRE_CONFIGS = [
  { id: 28,  key: 'genres.action' },
  { id: 35,  key: 'genres.comedy' },
  { id: 18,  key: 'genres.drama' },
  { id: 27,  key: 'genres.horror' },
  { id: 878, key: 'genres.scifi' },
  { id: 16,  key: 'genres.animation' },
]

type GenreRow = { id: number; key: string; movies: any[] }

function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
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
  const tmdbLang = i18n.language === 'ru' ? 'ru-RU' : 'en-US'

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)

  // Home state
  const [randomPick, setRandomPick] = useState<any | null>(null)
  const [randomLoading, setRandomLoading] = useState(false)

  // Shared
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

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

  // Reset the random pick when the language changes (its texts are stale).
  useEffect(() => {
    setRandomPick(null)
  }, [i18n.language])

  // Home data (trending + genre rows), cached per language by React Query.
  const { data: homeData, isLoading: homeLoading } = useQuery({
    queryKey: ['home', tmdbLang],
    queryFn: async () => {
      const [trendingRes, ...genreResponses] = await Promise.all([
        fetch(`/api/tmdb/trending/all/week?language=${tmdbLang}`),
        ...GENRE_CONFIGS.map(g =>
          fetch(`/api/tmdb/discover/movie?with_genres=${g.id}&sort_by=vote_average.desc&vote_count.gte=500&page=1&language=${tmdbLang}`)
        ),
      ])
      const trendingData = await trendingRes.json()
      const genreData = await Promise.all(genreResponses.map(r => r.json()))
      return {
        trending: (trendingData.results || [])
          .filter((i: any) => i.media_type !== 'person')
          .slice(0, 14),
        genres: GENRE_CONFIGS.map((g, i) => ({
          ...g,
          movies: (genreData[i].results || []).slice(0, 10),
        })) as GenreRow[],
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
    setRandomLoading(true)
    try {
      const pool: any[] = await queryClient.fetchQuery({
        queryKey: ['random-pool', tmdbLang],
        staleTime: Infinity,
        queryFn: async () => {
          const pages = await Promise.all([1, 2, 3].map(p =>
            fetch(`/api/tmdb/discover/movie?language=${tmdbLang}&sort_by=popularity.desc&vote_count.gte=100&page=${p}`).then(r => r.json())
          ))
          return pages.flatMap((d: any) => d.results || []).filter((m: any) => m.poster_path && m.backdrop_path)
        },
      })
      const candidates = pool.filter(m => m.id !== randomPick?.id && notInLibrary(m))
      if (candidates.length > 0) {
        setRandomPick(candidates[Math.floor(Math.random() * candidates.length)])
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
      const res = await fetch(
        `/api/tmdb/search/multi?language=${tmdbLang}&query=${encodeURIComponent(q)}`
      )
      const data = await res.json()
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
      const res = await fetch(
        `/api/tmdb/search/multi?language=${tmdbLang}&query=${encodeURIComponent(query)}`
      )
      const data = await res.json()
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
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg cursor-pointer select-none ${
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

            {randomPick ? (
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
              <ScrollRow>
                {trending.filter(notInLibrary).map(item => (
                  <CardTile
                    key={item.id}
                    item={item}
                    status={itemStatuses[item.id] || ''}
                    onStatus={s => addToLibrary(item, s)}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </ScrollRow>
            )}
          </section>

          {/* Genre rows (skip a genre once all its picks are already in the library) */}
          {!homeLoading && genres.map(genre => {
            const movies = genre.movies.filter(notInLibrary)
            if (movies.length === 0) return null
            return (
            <section key={genre.id}>
              <h2 className="text-lg font-bold text-gray-100 mb-3">{t(genre.key)}</h2>
              <ScrollRow>
                {movies.map(item => (
                  <CardTile
                    key={item.id}
                    item={item}
                    status={itemStatuses[item.id] || ''}
                    onStatus={s => addToLibrary(item, s)}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </ScrollRow>
            </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
