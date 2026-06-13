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
