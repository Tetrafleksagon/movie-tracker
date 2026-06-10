import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function getStatusColor(s: string) {
  if (s === 'watched') return '#16a34a'
  if (s === 'watching') return '#2563eb'
  if (s === 'dropped') return '#dc2626'
  if (s === 'planned') return '#4b5563'
  return '#374151'
}

type Props = {
  item: any
  status: string
  lang: string
  onStatus: (s: string) => void
  onClose: () => void
}

export function MovieModal({ item, status, lang, onStatus, onClose }: Props) {
  const { t } = useTranslation()
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie'
    fetch(`https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_KEY}&language=${lang}`)
      .then(r => r.json())
      .then(setDetails)
      .catch(() => {})

    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [item.id])

  const d = details || item
  const title = d.title || d.name
  const year = (d.release_date || d.first_air_date || '').split('-')[0]
  const runtime = details?.runtime
    ? `${details.runtime} ${t('common.min')}`
    : details?.episode_run_time?.[0]
      ? `~${details.episode_run_time[0]} ${t('common.min')}`
      : null
  const rating = d.vote_average > 0 ? d.vote_average.toFixed(1) : null
  const voteCount = details?.vote_count ? details.vote_count.toLocaleString() : null
  const genres: string[] = details?.genres?.map((g: any) => g.name) || []
  const tagline: string = details?.tagline || ''
  const overview: string = d.overview || ''
  const backdrop = d.backdrop_path
  const poster = d.poster_path
  const isTV = item.media_type === 'tv'
  const seasons = details?.number_of_seasons

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-800 rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white text-xl leading-none hover:bg-black/90 transition"
        >
          ×
        </button>

        {/* Scrollable area */}
        <div className="overflow-y-auto">

          {/* Backdrop */}
          <div className="relative h-52 sm:h-72 flex-shrink-0">
            {backdrop ? (
              <img
                src={`https://image.tmdb.org/t/p/w1280${backdrop}`}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : poster ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${poster}`}
                alt={title}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-gray-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-gray-800/10 to-transparent" />

            {/* Title block */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pr-12">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{title}</h2>
              <p className="text-sm text-gray-300 mt-1 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                {year && <span>{year}</span>}
                {isTV && seasons && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>{seasons} {t('modal.seasons')}</span>
                  </>
                )}
                {runtime && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>{runtime}</span>
                  </>
                )}
                {rating && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span className="text-yellow-400 font-semibold">⭐ {rating}</span>
                    {voteCount && <span className="text-gray-500 text-xs">({voteCount})</span>}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map(g => (
                  <span
                    key={g}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-900/70 text-indigo-300 font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Tagline */}
            {tagline && (
              <p className="text-sm text-gray-400 italic border-l-2 border-indigo-500/50 pl-3">
                {tagline}
              </p>
            )}

            {/* Overview */}
            {overview ? (
              <p className="text-sm text-gray-200 leading-relaxed">{overview}</p>
            ) : !details ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-700 rounded w-5/6" />
                <div className="h-3 bg-gray-700 rounded w-4/6" />
              </div>
            ) : null}

            {/* Add to library */}
            <select
              value={status || ''}
              onChange={e => { if (e.target.value) onStatus(e.target.value) }}
              className="w-full py-2.5 px-3 rounded-lg text-sm text-white font-medium cursor-pointer border-none focus:outline-none"
              style={{ backgroundColor: getStatusColor(status) }}
            >
              <option value="" disabled>+ {t('common.add')}</option>
              <option value="planned">📋 {t('status.planned')}</option>
              <option value="watching">👀 {t('status.watching')}</option>
              <option value="watched">✅ {t('status.watched')}</option>
              <option value="dropped">❌ {t('status.dropped')}</option>
            </select>

          </div>
        </div>
      </div>
    </div>
  )
}
