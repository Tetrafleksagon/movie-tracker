import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getPosterUrl } from '../lib/tmdb'

const RATING_COLORS: Record<number, string> = {
  1: '#7f1d1d', 2: '#991b1b', 3: '#b91c1c',
  4: '#92400e', 5: '#b45309', 6: '#d97706',
  7: '#166534', 8: '#15803d', 9: '#16a34a', 10: '#22c55e',
}

export function SharedLibrary() {
  const { userId } = useParams<{ userId: string }>()
  const { t } = useTranslation()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (userId) fetchSharedLibrary(userId)
  }, [userId])

  const fetchSharedLibrary = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_media')
      .select(`
        *, user_rating,
        media_cache:media_cache (tmdb_id, title, poster_path, vote_average, release_date, media_type)
      `)
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error(error)
      setNotFound(true)
    } else {
      setItems((data || []).map(item => ({
        ...item,
        title: item.media_cache?.title || t('common.no_title'),
        poster_path: item.media_cache?.poster_path,
        vote_average: item.media_cache?.vote_average,
        media_type: item.media_cache?.media_type || 'movie',
        release_date: item.media_cache?.release_date,
      })))
    }
    setLoading(false)
  }

  const getStatusColor = (s: string) => {
    if (s === 'watched') return '#16a34a'
    if (s === 'watching') return '#2563eb'
    if (s === 'dropped') return '#dc2626'
    return '#4b5563'
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a
            href="https://filmtrack.pp.ua"
            className="text-xl font-bold hover:opacity-80 transition"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #1e3a8a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎬 Movie Tracker
          </a>
          <Link to="/" className="text-sm text-blue-400 hover:text-blue-300 transition">
            {t('public_library.open_app')}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-200">{t('public_library.title')}</h2>
          {!loading && !notFound && (
            <span className="text-sm text-gray-500">{items.length} {t('public_library.items')}</span>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">{t('public_library.loading')}</p>
        ) : notFound ? (
          <p className="text-center text-red-400 py-16">{t('public_library.error')}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-16">{t('public_library.empty')}</p>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const year = (item.release_date || '').split('-')[0] || '—'
              const tmdbRating = item.vote_average ? item.vote_average.toFixed(1) : null
              const typeLabel = item.media_type === 'tv' ? `📺 ${t('media.tv_show')}` : `🎬 ${t('media.movie')}`

              return (
                <div key={item.tmdb_id} className="flex gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
                  {/* Постер */}
                  <div className="relative rounded-lg overflow-hidden flex-shrink-0 w-20 sm:w-28" style={{ aspectRatio: '2/3' }}>
                    <img
                      src={getPosterUrl(item.poster_path)}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt={item.title}
                    />
                    {tmdbRating && (
                      <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.85)', padding: '2px 5px', borderRadius: 4, fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
                        ⭐ {tmdbRating}
                      </div>
                    )}
                  </div>

                  {/* Инфо */}
                  <div className="flex flex-col gap-2 justify-center flex-1 min-w-0">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug break-words">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{year}</span>
                        <span className="text-gray-600">•</span>
                        <span>{typeLabel}</span>
                      </p>
                    </div>

                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md w-fit"
                      style={{ backgroundColor: getStatusColor(item.status), color: '#fff' }}
                    >
                      {t(`status.${item.status}`) || item.status}
                    </span>

                    {item.user_rating && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <div
                            key={n}
                            style={{
                              width: 20, height: 20, borderRadius: 4,
                              backgroundColor: n <= item.user_rating ? RATING_COLORS[item.user_rating] : '#374151',
                              fontSize: 10, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: n <= item.user_rating ? '#fff' : '#4b5563',
                            }}
                          >
                            {n}
                          </div>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{item.user_rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-600 py-6">
        Copyright Fleksagon {new Date().getFullYear()}
      </footer>
    </div>
  )
}
