import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { StatusSelect } from './StatusSelect'

type Props = {
  item: any
  status: string
  lang: string
  onStatus: (s: string) => void
  onClose: () => void
}

export function MovieModal({ item, status, lang, onStatus, onClose }: Props) {
  const { t } = useTranslation()
  const langShort = lang.startsWith('ru') ? 'ru' : 'en'
  const [playTrailer, setPlayTrailer] = useState(false)

  const type = item.media_type === 'tv' ? 'tv' : 'movie'
  // One request pulls details + trailers + cast; cached per title+language.
  const { data: details } = useQuery({
    queryKey: ['details', type, item.id, lang],
    queryFn: () =>
      fetch(
        `/api/tmdb/${type}/${item.id}?language=${lang}` +
        `&append_to_response=videos,credits&include_video_language=${langShort},en`
      ).then(r => r.json()),
  })

  useEffect(() => {
    setPlayTrailer(false)

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

  // Trailer: score YouTube clips so the UI-language trailer wins when it exists,
  // preferring Trailer > Teaser > other, with English as fallback.
  const videos: any[] = details?.videos?.results || []
  const ytVideos = videos.filter(v => v.site === 'YouTube')
  const videoScore = (v: any) => {
    let s = v.type === 'Trailer' ? 1000 : v.type === 'Teaser' ? 500 : 100
    if (v.iso_639_1 === langShort) s += 200
    if (v.official) s += 10
    return s
  }
  const trailer = ytVideos.length
    ? [...ytVideos].sort((a, b) => videoScore(b) - videoScore(a))[0]
    : undefined

  // Cast: top billed.
  const cast: any[] = (details?.credits?.cast || []).slice(0, 12)

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

          {/* Backdrop / trailer */}
          <div className="relative h-52 sm:h-72 flex-shrink-0 bg-gray-900">
            {playTrailer && trailer ? (
              <div className="w-full h-full bg-black flex flex-col">
                {/* Spacer so the close button sits clear of YouTube's top bar */}
                <div className="h-10 flex-shrink-0" />
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
                  title={title}
                  className="w-full flex-1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <>
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

                {/* Play trailer button */}
                {trailer && (
                  <button
                    onClick={() => setPlayTrailer(true)}
                    title={t('modal.trailer')}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white text-2xl transition-colors shadow-lg group"
                  >
                    <span className="ml-1 group-hover:scale-110 transition-transform">▶</span>
                  </button>
                )}

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
              </>
            )}
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

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">{t('modal.cast')}</h3>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
                  {cast.map((c: any) => (
                    <div key={c.id} className="flex-shrink-0 w-20 text-center">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 mb-1 flex items-center justify-center">
                        {c.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-2xl text-gray-500">👤</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-200 leading-tight line-clamp-2">{c.name}</p>
                      {c.character && (
                        <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{c.character}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to library */}
            <StatusSelect
              value={status}
              onStatus={onStatus}
              className="w-full py-2.5 px-3 rounded-lg text-sm text-white font-medium cursor-pointer border-none focus:outline-none"
            />

          </div>
        </div>
      </div>
    </div>
  )
}
