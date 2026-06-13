import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getPosterUrl } from '../lib/tmdb'
import { APP_VERSION } from '../lib/version'
import { RATING_COLORS, getStatusColor } from '../lib/status'
import { fetchProfileById } from '../lib/profile'
import { MovieModal } from './MovieModal'
import { Avatar } from './Avatar'

export function SharedLibrary() {
  const { userId } = useParams<{ userId: string }>()
  const { t, i18n } = useTranslation()
  const tmdbLang = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [ownerName, setOwnerName] = useState<string | null>(null)
  const [ownerPremium, setOwnerPremium] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchSharedLibrary(userId)
      fetchProfileById(userId).then(p => {
        setOwnerName(p?.display_name?.trim() || null)
        setOwnerPremium(!!p?.is_premium)
      })
    }
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
        <div className="flex items-center gap-3 mb-6">
          {ownerName && <Avatar name={ownerName} size={40} premium={ownerPremium} />}
          <h2 className="text-xl font-bold text-gray-200 min-w-0 truncate">
            {ownerName ? t('public_library.title_named', { name: ownerName }) : t('public_library.title')}
          </h2>
          {ownerPremium && (
            <span className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-full px-2 py-0.5">
              ★ {t('premium.badge')}
            </span>
          )}
          {!loading && !notFound && (
            <span className="text-sm text-gray-500 flex-shrink-0 ml-auto">{items.length} {t('public_library.items')}</span>
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
                  <div
                    className="relative rounded-lg overflow-hidden flex-shrink-0 w-20 sm:w-28 cursor-pointer group"
                    style={{ aspectRatio: '2/3' }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={getPosterUrl(item.poster_path)}
                      className="absolute inset-0 w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
                      alt={item.title}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-white text-3xl drop-shadow-lg">🔍</span>
                    </div>
                    {tmdbRating && (
                      <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.85)', padding: '2px 5px', borderRadius: 4, fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
                        ⭐ {tmdbRating}
                      </div>
                    )}
                  </div>

                  {/* Инфо */}
                  <div className="flex flex-col gap-2 justify-center flex-1 min-w-0">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug break-words cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setSelectedItem(item)}>{item.title}</h3>
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

      {selectedItem && (
        <MovieModal
          item={{ ...selectedItem, id: selectedItem.tmdb_id }}
          status=""
          lang={tmdbLang}
          onStatus={() => {}}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <footer className="text-center text-xs text-gray-600 py-6">
        Copyright Fleksagon {new Date().getFullYear()}
        <span className="block mt-0.5 text-[10px] text-gray-500 select-all">v{APP_VERSION}</span>
      </footer>
    </div>
  )
}
