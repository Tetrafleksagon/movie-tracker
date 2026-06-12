import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from './EmptyState'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getPosterUrl } from '../lib/tmdb'
import { STATUS_OPTIONS, getStatusColor, RATING_COLORS } from '../lib/status'
import { fetchAllEpisodes } from '../lib/episodes'

type Row = {
  status: string
  user_rating: number | null
  media_cache: {
    title: string | null
    poster_path: string | null
    vote_average: number | null
    release_date: string | null
    media_type: string | null
  } | null
}

// ── Small presentational helpers ────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
      <div className="text-3xl font-bold tabular-nums" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}

function Section({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-100">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-gray-400 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-700/40 rounded-full h-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value > 0 ? Math.max(pct, 4) : 0}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-xs text-gray-300 text-right tabular-nums flex-shrink-0">{value}</span>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function Stats() {
  const { t } = useTranslation()

  const { data: allEpisodes } = useQuery({ queryKey: ['episodes'], queryFn: fetchAllEpisodes })
  const episodesWatched = (allEpisodes || []).length

  const { data: rows } = useQuery<Row[]>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('user_media')
        .select('status, user_rating, media_cache:media_cache (title, poster_path, vote_average, release_date, media_type)')
        .eq('user_id', user.id)
      if (error) { console.error('Stats fetch error:', error); return [] }
      return (data as any) || []
    },
  })

  const stats = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const byStatus: Record<string, number> = { planned: 0, watching: 0, watched: 0, dropped: 0 }
    const byType = { movie: 0, tv: 0 }
    const ratingDist: Record<number, number> = {}
    const decades: Record<string, number> = {}
    let ratedCount = 0, ratingSum = 0
    let tmdbCount = 0, tmdbSum = 0

    for (const r of rows) {
      if (r.status && byStatus[r.status] !== undefined) byStatus[r.status]++
      const type = r.media_cache?.media_type === 'tv' ? 'tv' : 'movie'
      byType[type]++
      if (r.user_rating) {
        ratedCount++
        ratingSum += r.user_rating
        ratingDist[r.user_rating] = (ratingDist[r.user_rating] || 0) + 1
      }
      const va = r.media_cache?.vote_average
      if (va && va > 0) { tmdbCount++; tmdbSum += va }
      const year = parseInt((r.media_cache?.release_date || '').slice(0, 4), 10)
      if (year) {
        const dec = `${Math.floor(year / 10) * 10}s`
        decades[dec] = (decades[dec] || 0) + 1
      }
    }

    const topRated = rows
      .filter(r => r.user_rating)
      .sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0))
      .slice(0, 12)

    return {
      total: rows.length,
      byStatus,
      byType,
      ratingDist,
      decades,
      topRated,
      avgRating: ratedCount ? ratingSum / ratedCount : 0,
      ratedCount,
      tmdbAvg: tmdbCount ? tmdbSum / tmdbCount : 0,
    }
  }, [rows])

  if (!rows) {
    return <p className="text-center text-gray-400 py-16 animate-pulse">{t('common.loading')}</p>
  }

  if (!stats) {
    return (
      <EmptyState
        icon="📊"
        title={t('stats.empty')}
        subtitle={t('library.start_searching')}
        actionLabel={t('library.go_search')}
        actionTo="/"
      />
    )
  }

  const maxStatus = Math.max(...Object.values(stats.byStatus), 1)
  const maxType = Math.max(stats.byType.movie, stats.byType.tv, 1)
  const maxRating = Math.max(...Object.values(stats.ratingDist), 1)
  const decadeEntries = Object.entries(stats.decades).sort((a, b) => a[0].localeCompare(b[0]))
  const maxDecade = Math.max(...decadeEntries.map(([, v]) => v), 1)

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-100">{t('stats.title')}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label={t('stats.total')} value={stats.total} accent="#fff" />
        <StatCard label={t('stats.movies')} value={stats.byType.movie} accent="#60a5fa" />
        <StatCard label={t('stats.tv_shows')} value={stats.byType.tv} accent="#a78bfa" />
        <StatCard label={t('stats.episodes_watched')} value={episodesWatched} accent="#818cf8" />
        <StatCard
          label={t('stats.avg_score')}
          value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
          accent="#fbbf24"
        />
      </div>

      {/* Status breakdown */}
      <Section title={t('stats.by_status')}>
        <div className="space-y-2.5">
          {STATUS_OPTIONS.map(s => (
            <Bar
              key={s.value}
              label={t(`status.${s.value}`)}
              value={stats.byStatus[s.value]}
              max={maxStatus}
              color={getStatusColor(s.value)}
            />
          ))}
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Rating distribution */}
        <Section
          title={t('stats.rating_distribution')}
          extra={
            <span className="text-xs text-gray-500">
              {t('stats.rated')}: {stats.ratedCount}
            </span>
          }
        >
          {stats.ratedCount === 0 ? (
            <p className="text-sm text-gray-500 py-2">{t('stats.no_ratings')}</p>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 10 }, (_, i) => 10 - i).map(n => (
                <Bar
                  key={n}
                  label={`${n} ★`}
                  value={stats.ratingDist[n] || 0}
                  max={maxRating}
                  color={RATING_COLORS[n]}
                />
              ))}
            </div>
          )}
        </Section>

        {/* By decade */}
        <Section
          title={t('stats.by_decade')}
          extra={
            stats.tmdbAvg > 0 ? (
              <span className="text-xs text-gray-500">
                {t('stats.tmdb_avg')}: <span className="text-yellow-400">⭐ {stats.tmdbAvg.toFixed(1)}</span>
              </span>
            ) : undefined
          }
        >
          {decadeEntries.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">—</p>
          ) : (
            <div className="space-y-2">
              {decadeEntries.map(([dec, count]) => (
                <Bar key={dec} label={dec} value={count} max={maxDecade} color="#6366f1" />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Top rated */}
      {stats.topRated.length > 0 && (
        <Section title={t('stats.top_rated')}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {stats.topRated.map((r, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden bg-gray-700/40">
                <div className="relative" style={{ aspectRatio: '2/3' }}>
                  <img
                    src={getPosterUrl(r.media_cache?.poster_path ?? null)}
                    alt={r.media_cache?.title || ''}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <div
                    className="absolute top-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: RATING_COLORS[r.user_rating || 1], color: '#fff' }}
                  >
                    {r.user_rating}
                  </div>
                </div>
                <p className="text-xs text-gray-300 px-1.5 py-1 truncate" title={r.media_cache?.title || ''}>
                  {r.media_cache?.title || t('common.no_title')}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </main>
  )
}
