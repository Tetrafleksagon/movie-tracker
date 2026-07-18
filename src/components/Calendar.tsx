import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getPosterUrl, fetchMediaDetails, tmdbLangTag } from '../lib/tmdb'
import { fetchCalendarSources, type CalendarSource } from '../lib/library'
import { MovieModal } from './MovieModal'
import { EmptyState } from './EmptyState'
import { FilmStripLoader } from './FilmStripLoader'

type Entry = {
  date: string            // YYYY-MM-DD
  kind: 'episode' | 'movie'
  tmdb_id: number
  media_type: string
  title: string
  poster_path: string | null
  sub: string             // "S2E5 · Episode name" or the premiere label
}

// Local YYYY-MM-DD for "today" so comparisons ignore the time of day.
function todayKey(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function Calendar() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const tmdbLang = tmdbLangTag(i18n.language)
  const locale = i18n.language
  const [modal, setModal] = useState<{ item: any; status: string } | null>(null)

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['calendar-sources'],
    queryFn: fetchCalendarSources,
  })

  const tvShows = useMemo(
    () => (sources || []).filter(s => s.media_type === 'tv'),
    [sources]
  )

  // One details request per TV show — shared cache key with MediaCard/modal, so
  // most are already warm after visiting the library.
  const detailResults = useQueries({
    queries: tvShows.map(s => ({
      queryKey: ['details', 'tv', s.tmdb_id, tmdbLang],
      queryFn: () => fetchMediaDetails('tv', s.tmdb_id, tmdbLang),
    })),
  })

  const detailsLoading = detailResults.some(r => r.isLoading)

  const sourceById = useMemo(() => {
    const m = new Map<number, CalendarSource>()
    for (const s of sources || []) m.set(s.tmdb_id, s)
    return m
  }, [sources])

  const entries = useMemo(() => {
    const today = todayKey()
    const list: Entry[] = []

    // Upcoming episodes of tracked TV shows.
    tvShows.forEach((s, i) => {
      const d = detailResults[i]?.data
      const ne = d?.next_episode_to_air
      if (ne?.air_date && ne.air_date >= today) {
        const label = `S${ne.season_number}E${ne.episode_number}`
        list.push({
          date: ne.air_date,
          kind: 'episode',
          tmdb_id: s.tmdb_id,
          media_type: 'tv',
          title: d.name || s.title || t('common.no_title'),
          poster_path: d.poster_path || s.poster_path,
          sub: ne.name ? `${label} · ${ne.name}` : label,
        })
      }
    })

    // Unreleased movies already saved to the library.
    for (const s of sources || []) {
      if (s.media_type !== 'tv' && s.release_date && s.release_date >= today) {
        list.push({
          date: s.release_date,
          kind: 'movie',
          tmdb_id: s.tmdb_id,
          media_type: 'movie',
          title: s.title || t('common.no_title'),
          poster_path: s.poster_path,
          sub: t('calendar.premiere'),
        })
      }
    }

    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [sources, tvShows, detailResults, t])

  // Group sorted entries by "Month Year" for section headers.
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Entry[] }[] = []
    for (const e of entries) {
      const dt = new Date(e.date + 'T00:00:00')
      const key = e.date.slice(0, 7)
      let g = out.find(x => x.key === key)
      if (!g) {
        const label = dt.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        g = { key, label, items: [] }
        out.push(g)
      }
      g.items.push(e)
    }
    return out
  }, [entries, locale])

  const openEntry = (e: Entry) => {
    const src = sourceById.get(e.tmdb_id)
    setModal({
      item: {
        id: e.tmdb_id,
        tmdb_id: e.tmdb_id,
        media_type: e.media_type,
        title: e.title,
        poster_path: e.poster_path,
      },
      status: src?.status || '',
    })
  }

  // Save a status change made from the modal (mirrors MediaCard's upsert), then
  // refresh the caches that depend on it.
  const saveStatus = async (newStatus: string) => {
    if (!modal) return
    const item = modal.item
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert(t('auth.please_login')); return }

    const now = new Date().toISOString()
    const prevHistory = (sourceById.get(item.id)?.status_history as any[]) || []
    const updatedHistory = [{ status: newStatus, time: now }, ...prevHistory].slice(0, 3)

    await supabase.from('media_cache').upsert({
      tmdb_id: item.id, media_type: item.media_type, title: item.title,
      poster_path: item.poster_path, release_date: item.release_date || null,
    }, { onConflict: 'tmdb_id' })

    const { error } = await supabase.from('user_media').upsert({
      user_id: user.id, tmdb_id: item.id, status: newStatus,
      updated_at: now, status_history: updatedHistory,
    }, { onConflict: 'user_id,tmdb_id' })

    if (error) { console.error('Status save error:', error); alert(t('common.error_save')); return }

    setModal(m => (m ? { ...m, status: newStatus } : m))
    queryClient.invalidateQueries({ queryKey: ['library'] })
    queryClient.invalidateQueries({ queryKey: ['library-ids'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['calendar-sources'] })
  }

  const loading = sourcesLoading || detailsLoading

  return (
    <main className="max-w-3xl mx-auto px-4 pt-4 pb-8">
      <h2 className="text-xl font-bold text-white mb-4">📅 {t('calendar.title')}</h2>

      {loading ? (
        <FilmStripLoader />
      ) : entries.length === 0 ? (
        <EmptyState icon="📅" title={t('calendar.empty')} subtitle={t('calendar.empty_sub')} />
      ) : (
        <div className="space-y-6">
          {groups.map(g => (
            <section key={g.key}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">{g.label}</h3>
              <div className="space-y-2">
                {g.items.map((e, i) => {
                  const dt = new Date(e.date + 'T00:00:00')
                  const day = dt.toLocaleDateString(locale, { day: 'numeric' })
                  const wd = dt.toLocaleDateString(locale, { weekday: 'short' })
                  return (
                    <button
                      key={`${e.tmdb_id}-${e.kind}-${i}`}
                      onClick={() => openEntry(e)}
                      className="flex items-center gap-3 w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-2.5 transition"
                    >
                      <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                        <span className="text-xl font-bold text-white leading-none tabular-nums">{day}</span>
                        <span className="text-[10px] text-gray-400 uppercase mt-0.5">{wd}</span>
                      </div>
                      <img
                        src={getPosterUrl(e.poster_path)}
                        alt={e.title}
                        className="w-10 h-14 object-cover object-top rounded flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{e.title}</p>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                          <span>{e.kind === 'episode' ? '📺' : '🎬'}</span>
                          <span className="truncate">{e.sub}</span>
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {modal && (
        <MovieModal
          item={modal.item}
          status={modal.status}
          lang={tmdbLang}
          onStatus={saveStatus}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  )
}
