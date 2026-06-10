import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export function Search() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  // Закрывать подсказки при клике вне поля
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showToast = (message: string, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, error })
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  const fetchSuggestions = async (q: string) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`
      )
      const data = await res.json()
      const items = (data.results || [])
        .filter((i: any) => i.media_type !== 'person')
        .slice(0, 7)
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
    setQuery(item.title || item.name)
    setResults(suggestions)
    setShowSuggestions(false)
    setSuggestions([])
    setItemStatuses({})
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setShowSuggestions(false)
    setLoading(true)
    setItemStatuses({})
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
      )
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addToLibrary = async (item: any, status: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const title = item.title || item.name
    const now = new Date().toISOString()

    const { error: cacheError } = await supabase.from('media_cache').upsert({
      tmdb_id: item.id,
      media_type: item.media_type,
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
      showToast('Error adding to library', true)
      setItemStatuses(prev => { const next = { ...prev }; delete next[item.id]; return next })
    } else {
      showToast('✓ ' + title)
    }
  }

  const getStatusColor = (s: string) => {
    if (s === 'watched') return '#16a34a'
    if (s === 'watching') return '#2563eb'
    if (s === 'dropped') return '#dc2626'
    if (s === 'planned') return '#4b5563'
    return '#374151'
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

      <h2 className="text-2xl font-bold mb-6">{t('header.search')}</h2>

      <form onSubmit={handleSearch} className="mb-8">
        <div ref={searchWrapperRef} className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded font-medium transition"
            >
              {loading ? t('common.loading') : t('header.search')}
            </button>
          </div>

          {/* Подсказки */}
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
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(item) }}
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
                      <span className="text-sm text-yellow-400 ml-4 flex-shrink-0 tabular-nums">
                        {rating}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {results.map(item => (
          <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition">
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
              <h3 className="font-semibold text-sm mb-2 truncate">
                {item.title || item.name}
              </h3>
              <select
                value={itemStatuses[item.id] || ''}
                onChange={(e) => {
                  const status = e.target.value
                  if (!status) return
                  setItemStatuses(prev => ({ ...prev, [item.id]: status }))
                  addToLibrary(item, status)
                }}
                className="w-full py-1.5 px-2 rounded text-sm text-white font-medium cursor-pointer border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ backgroundColor: getStatusColor(itemStatuses[item.id] || '') }}
              >
                <option value="" disabled>+ {t('common.add')}</option>
                <option value="planned">📋 {t('status.planned')}</option>
                <option value="watching">👀 {t('status.watching')}</option>
                <option value="watched">✅ {t('status.watched')}</option>
                <option value="dropped">❌ {t('status.dropped')}</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-center text-gray-400 mt-8">
          {t('search.start_typing')}
        </p>
      )}
    </main>
  )
}
