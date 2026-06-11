import { supabase } from './supabase'

// Shared episode-progress logic for EpisodeTracker (modal) and MediaCard (library).

export type EpisodeRow = { tmdb_id: number; season: number; episode: number }
export type SeasonInfo = { season_number: number; episode_count: number }

export const epKey = (s: number, e: number) => `${s}:${e}`

// Specials (season 0) are excluded: they would make "fully watched" unreachable.
export function realSeasons(seasons: SeasonInfo[] | null | undefined): SeasonInfo[] {
  return (seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0)
}

export function totalEpisodeCount(seasons: SeasonInfo[]): number {
  return seasons.reduce((sum, s) => sum + s.episode_count, 0)
}

// First unwatched episode in airing order, or null when everything is watched.
export function nextUnwatched(
  seasons: SeasonInfo[],
  watched: Set<string>
): { season: number; episode: number } | null {
  for (const s of seasons) {
    for (let e = 1; e <= s.episode_count; e++) {
      if (!watched.has(epKey(s.season_number, e))) return { season: s.season_number, episode: e }
    }
  }
  return null
}

// Library status that should follow from progress; null = leave as is.
export function statusAfterProgress(watchedCount: number, total: number, current: string): string | null {
  if (total > 0 && watchedCount >= total) return current !== 'watched' ? 'watched' : null
  if (watchedCount > 0 && (!current || current === 'planned' || current === 'watched')) return 'watching'
  return null
}

// Every watched episode of the signed-in user in one query — a single shared
// cache entry serves all library cards and the modal. null = signed out.
export async function fetchAllEpisodes(): Promise<EpisodeRow[] | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_episodes')
    .select('tmdb_id, season, episode')
    .eq('user_id', user.id)
  if (error) throw error
  return data || []
}

export async function insertEpisode(tmdbId: number, season: number, episode: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'not signed in' } }
  return supabase.from('user_episodes').upsert(
    { user_id: user.id, tmdb_id: tmdbId, season, episode },
    { onConflict: 'user_id,tmdb_id,season,episode', ignoreDuplicates: true }
  )
}
