import { supabase } from './supabase'

// Set of tmdb_ids already in the signed-in user's library — used to keep
// recommendations/random from suggesting titles the user has already added.
// null = signed out (no filtering applied).
export async function fetchLibraryIds(): Promise<Set<number> | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_media')
    .select('tmdb_id')
    .eq('user_id', user.id)
  if (error) throw error
  return new Set((data || []).map(r => r.tmdb_id))
}

// Minimal library rows for the premiere calendar: enough to know each title's
// type, current status/history (so the modal can edit it) and cached
// poster/date. TV air-dates come from per-show TMDB details (fetched separately,
// with the same cache key as MediaCard/modal), so this stays a single query.
export type CalendarSource = {
  tmdb_id: number
  status: string | null
  status_history: any
  media_type: string
  title: string | null
  poster_path: string | null
  release_date: string | null
}

export async function fetchCalendarSources(): Promise<CalendarSource[] | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_media')
    .select('tmdb_id, status, status_history, media_cache:media_cache (title, poster_path, media_type, release_date)')
    .eq('user_id', user.id)
  if (error) throw error
  return (data || []).map((r: any) => ({
    tmdb_id: r.tmdb_id,
    status: r.status ?? null,
    status_history: r.status_history ?? [],
    media_type: r.media_cache?.media_type || 'movie',
    title: r.media_cache?.title ?? null,
    poster_path: r.media_cache?.poster_path ?? null,
    release_date: r.media_cache?.release_date ?? null,
  }))
}
