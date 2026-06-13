import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

// Entitlement layer. The subscriptions table is written only by the service
// role (manual grant now, payment webhook later); the client just reads it.

export type Subscription = {
  status: string
  plan: string | null
  current_period_end: string | null
}

export async function fetchSubscription(): Promise<Subscription | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) { console.error('Subscription fetch error:', error); return null }
  return data
}

// "Premium active" = status active and not past its period end (if any).
export function isPremiumActive(sub: Subscription | null | undefined): boolean {
  if (!sub || sub.status !== 'active') return false
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false
  return true
}

// Convenience hook used to gate premium features in the UI.
export function useSubscription() {
  const { data, isLoading } = useQuery({ queryKey: ['subscription'], queryFn: fetchSubscription })
  return { isPremium: isPremiumActive(data), loading: isLoading, subscription: data }
}
