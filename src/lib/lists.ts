import { supabase } from './supabase'

// Custom lists data layer, shared by the /lists page and the modal's add menu.

export type UserList = { id: string; name: string; created_at: string }

// Minimal media shape needed to cache a title for list display.
export type ListMedia = {
  id: number
  media_type?: string
  title?: string
  name?: string
  poster_path?: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
}

// null = signed out (lists UI hidden).
export async function fetchLists(): Promise<UserList[] | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_lists')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createList(name: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: 'not signed in' } }
  return supabase
    .from('user_lists')
    .insert({ user_id: user.id, name: name.trim() })
    .select('id, name, created_at')
    .single()
}

export async function deleteList(id: string) {
  return supabase.from('user_lists').delete().eq('id', id)
}

// IDs of the current user's lists that contain a given title (RLS scopes it).
export async function fetchItemListIds(tmdbId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_list_items')
    .select('list_id')
    .eq('tmdb_id', tmdbId)
  if (error) throw error
  return (data || []).map(r => r.list_id)
}

// Caches the title (so posters render even if it's not in the library), then links it.
export async function addToList(listId: string, item: ListMedia) {
  await supabase.from('media_cache').upsert({
    tmdb_id: item.id,
    media_type: item.media_type || 'movie',
    title: item.title || item.name,
    poster_path: item.poster_path,
    vote_average: item.vote_average || 0,
    release_date: item.release_date || item.first_air_date,
  }, { onConflict: 'tmdb_id' })

  return supabase
    .from('user_list_items')
    .upsert({ list_id: listId, tmdb_id: item.id }, { onConflict: 'list_id,tmdb_id', ignoreDuplicates: true })
}

export async function removeFromList(listId: string, tmdbId: number) {
  return supabase.from('user_list_items').delete().match({ list_id: listId, tmdb_id: tmdbId })
}

export async function fetchListItems(listId: string) {
  const { data, error } = await supabase
    .from('user_list_items')
    .select('tmdb_id, added_at, media_cache:media_cache (tmdb_id, title, poster_path, vote_average, release_date, media_type)')
    .eq('list_id', listId)
    .order('added_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row: any) => ({
    tmdb_id: row.tmdb_id,
    title: row.media_cache?.title || '',
    poster_path: row.media_cache?.poster_path ?? null,
    vote_average: row.media_cache?.vote_average ?? 0,
    release_date: row.media_cache?.release_date ?? '',
    media_type: row.media_cache?.media_type || 'movie',
  }))
}
