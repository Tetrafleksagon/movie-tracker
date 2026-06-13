import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type Profile = { id: string; display_name: string | null; avatar_url: string | null }

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  if (error) console.error('Profile fetch error:', error)
  return data ?? { id: user.id, display_name: null, avatar_url: null }
}

// Public read of any user's profile (used by share pages).
export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
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
