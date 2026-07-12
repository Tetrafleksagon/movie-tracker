import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type Profile = { id: string; display_name: string | null; avatar_url: string | null; is_premium: boolean }

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, is_premium')
    .eq('id', user.id)
    .maybeSingle()
  if (error) console.error('Profile fetch error:', error)
  return data ?? { id: user.id, display_name: null, avatar_url: null, is_premium: false }
}

// Public read of any user's profile (used by share pages).
export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, is_premium')
    .eq('id', id)
    .maybeSingle()
  return data ?? null
}

export async function updateDisplayName(name: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'not signed in' } }
  const clean = name.trim()
  // Mirror into auth metadata so the Supabase dashboard "Display name" populates too.
  await supabase.auth.updateUser({ data: { display_name: clean } })
  return supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: clean, updated_at: new Date().toISOString() }, { onConflict: 'id' })
}

// Path convention mirrors avatars_storage.sql RLS: `<uid>.webp` in bucket `avatars`.
function avatarPath(uid: string): string { return `${uid}.webp` }

// Upload the encoded WebP to Storage, then persist its public URL in profiles.
// The URL carries an `updated_at`-derived query param so browsers refresh their
// cached copy right after re-upload (Storage sends long-lived Cache-Control).
export async function uploadAvatar(blob: Blob) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'not signed in' } }

  const path = avatarPath(user.id)
  const up = await supabase.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: 'image/webp',
    cacheControl: '3600',
  })
  if (up.error) return { error: up.error }

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
  const now = new Date().toISOString()
  const url = `${pub.publicUrl}?v=${Date.parse(now)}`
  const res = await supabase
    .from('profiles')
    .upsert({ id: user.id, avatar_url: url, updated_at: now }, { onConflict: 'id' })
  return res.error ? { error: res.error } : { data: { avatar_url: url } }
}

export async function removeAvatar() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'not signed in' } }

  const del = await supabase.storage.from('avatars').remove([avatarPath(user.id)])
  // Storage remove is idempotent — a missing file returns error we can ignore.
  if (del.error && !/not.?found/i.test(del.error.message)) return { error: del.error }

  return supabase
    .from('profiles')
    .upsert({ id: user.id, avatar_url: null, updated_at: new Date().toISOString() }, { onConflict: 'id' })
}

// Name to show in the UI: chosen display name, else the email's local part.
export function displayNameOf(profile: Profile | null | undefined, email: string | null | undefined): string {
  const dn = profile?.display_name?.trim()
  if (dn) return dn
  if (email) return email.split('@')[0]
  return 'User'
}

export function useMyProfile() {
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchMyProfile })
  return { profile: data, loading: isLoading }
}
