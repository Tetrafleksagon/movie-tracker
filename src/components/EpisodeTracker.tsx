import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

type Season = { season_number: number; episode_count: number; name?: string }
type WatchedRow = { season: number; episode: number }

type Props = {
  tmdbId: number
  seasons: Season[]
  lang: string
  status: string
  onStatus: (s: string) => void
}

const epKey = (s: number, e: number) => `${s}:${e}`

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex-1 bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

type SeasonRowProps = {
  tmdbId: number
  season: Season
  lang: string
  watched: Set<string>
  onToggle: (season: number, episode: number, isWatched: boolean) => void
  onMarkSeason: (season: Season, mark: boolean) => void
}

function SeasonRow({ tmdbId, season, lang, watched, onToggle, onMarkSeason }: SeasonRowProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const n = season.season_number

  const watchedCount = useMemo(() => {
    let c = 0
    for (let e = 1; e <= season.episode_count; e++) if (watched.has(epKey(n, e))) c++
    return c
  }, [watched, n, season.episode_count])

  const complete = watchedCount === season.episode_count

  // Episode titles are fetched lazily, only when the season is expanded.
  const { data: seasonDetails } = useQuery({
    queryKey: ['season', tmdbId, n, lang],
    queryFn: () => fetch(`/api/tmdb/tv/${tmdbId}/season/${n}?language=${lang}`).then(r => r.json()),
    enabled: expanded,
  })

  return (
    <div className="bg-gray-700/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/40 transition text-left"
      >
        <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
          {t('episodes.season')} {n}
        </span>
        <ProgressBar value={watchedCount} max={season.episode_count} />
        <span className={`text-xs tabular-nums whitespace-nowrap ${complete ? 'text-green-400' : 'text-gray-400'}`}>
          {watchedCount}/{season.episode_count}{complete && ' ✓'}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          <button
            onClick={() => onMarkSeason(season, !complete)}
            className="w-full py-1.5 mb-1 rounded text-xs font-medium bg-gray-700/60 hover:bg-gray-600 text-gray-300 transition"
          >
            {complete ? t('episodes.unmark_all') : t('episodes.mark_all')}
          </button>

          {Array.from({ length: season.episode_count }, (_, i) => i + 1).map(e => {
            const isWatched = watched.has(epKey(n, e))
            const epName = seasonDetails?.episodes?.[i]?.name
            return (
              <button
                key={e}
                onClick={() => onToggle(n, e, isWatched)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-700/40 transition text-left"
              >
                <span
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold border transition-colors ${
                    isWatched
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-500 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className={`text-xs tabular-nums w-7 flex-shrink-0 ${isWatched ? 'text-gray-500' : 'text-gray-400'}`}>
                  {e}.
                </span>
                <span className={`text-xs truncate ${isWatched ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {epName || `${t('episodes.episode')} ${e}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EpisodeTracker({ tmdbId, seasons, lang, status, onStatus }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Specials (season 0) are excluded: they would make "fully watched" unreachable.
  const realSeasons = useMemo(
    () => (seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0),
    [seasons]
  )
  const totalEpisodes = useMemo(
    () => realSeasons.reduce((sum, s) => sum + s.episode_count, 0),
    [realSeasons]
  )

  // null → not signed in (tracker hidden), [] → signed in, nothing watched yet.
  const { data: watchedRows } = useQuery<WatchedRow[] | null>({
    queryKey: ['episodes', tmdbId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('user_episodes')
        .select('season, episode')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
      if (error) throw error
      return data || []
    },
  })

  const watched = useMemo(
    () => new Set((watchedRows || []).map(r => epKey(r.season, r.episode))),
    [watchedRows]
  )

  if (realSeasons.length === 0 || watchedRows === null || watchedRows === undefined) return null

  const setCache = (rows: WatchedRow[]) => {
    queryClient.setQueryData(['episodes', tmdbId], rows)
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  // Keep the library status in sync with actual progress.
  const applyAutoStatus = (newCount: number) => {
    if (newCount >= totalEpisodes && totalEpisodes > 0) {
      if (status !== 'watched') onStatus('watched')
    } else if (newCount > 0) {
      if (!status || status === 'planned' || status === 'watched') onStatus('watching')
    }
  }

  const toggleEpisode = async (season: number, episode: number, isWatched: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const rows = watchedRows || []
    if (isWatched) {
      const { error } = await supabase
        .from('user_episodes')
        .delete()
        .match({ user_id: user.id, tmdb_id: tmdbId, season, episode })
      if (error) { console.error('Episode unmark error:', error); return }
      const next = rows.filter(r => !(r.season === season && r.episode === episode))
      setCache(next)
      applyAutoStatus(next.length)
    } else {
      const { error } = await supabase
        .from('user_episodes')
        .upsert(
          { user_id: user.id, tmdb_id: tmdbId, season, episode },
          { onConflict: 'user_id,tmdb_id,season,episode' }
        )
      if (error) { console.error('Episode mark error:', error); return }
      const next = [...rows, { season, episode }]
      setCache(next)
      applyAutoStatus(next.length)
    }
  }

  const markSeason = async (season: Season, mark: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const n = season.season_number
    const rows = watchedRows || []
    if (mark) {
      const inserts = Array.from({ length: season.episode_count }, (_, i) => ({
        user_id: user.id, tmdb_id: tmdbId, season: n, episode: i + 1,
      }))
      const { error } = await supabase
        .from('user_episodes')
        .upsert(inserts, { onConflict: 'user_id,tmdb_id,season,episode' })
      if (error) { console.error('Season mark error:', error); return }
      const existing = new Set(rows.map(r => epKey(r.season, r.episode)))
      const added = inserts
        .filter(r => !existing.has(epKey(r.season, r.episode)))
        .map(r => ({ season: r.season, episode: r.episode }))
      const next = [...rows, ...added]
      setCache(next)
      applyAutoStatus(next.length)
    } else {
      const { error } = await supabase
        .from('user_episodes')
        .delete()
        .match({ user_id: user.id, tmdb_id: tmdbId, season: n })
      if (error) { console.error('Season unmark error:', error); return }
      const next = rows.filter(r => r.season !== n)
      setCache(next)
      applyAutoStatus(next.length)
    }
  }

  const totalWatched = watched.size

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-sm font-semibold text-gray-300 whitespace-nowrap">{t('episodes.title')}</h3>
        <ProgressBar value={totalWatched} max={totalEpisodes} />
        <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
          {totalWatched}/{totalEpisodes}
        </span>
      </div>
      <div className="space-y-1.5">
        {realSeasons.map(s => (
          <SeasonRow
            key={s.season_number}
            tmdbId={tmdbId}
            season={s}
            lang={lang}
            watched={watched}
            onToggle={toggleEpisode}
            onMarkSeason={markSeason}
          />
        ))}
      </div>
    </div>
  )
}
