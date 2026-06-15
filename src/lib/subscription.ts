import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

// Entitlement layer. The subscriptions table is written only by the service
// role (manual grant now, payment webhook later); the client just reads it.

export type Subscription = {
  status: string
  plan: string | null
  current_period_end: string | null
}

const FREE: Subscription = { status: 'inactive', plan: null, current_period_end: null }

// Launch promo: everyone who registered before this date gets premium *features*
// for free — without the premium *badge*. To end the promo later, set this to
// the real paid-subscriptions launch date (early users keep access) or delete
// the isEarlyAccess() call in useSubscription().
const EARLY_ACCESS_UNTIL = new Date('2027-01-01T00:00:00Z')

export function isEarlyAccess(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return new Date(createdAt) < EARLY_ACCESS_UNTIL
}

type SubState = { subscription: Subscription | null; createdAt: string | null }

// subscription is null only when signed out; a signed-in user without a row (or
// on error) is treated as free. createdAt drives the early-access promo.
async function fetchSubState(): Promise<SubState> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { subscription: null, createdAt: null }
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) { console.error('Subscription fetch error:', error); return { subscription: FREE, createdAt: user.created_at } }
  return { subscription: data ?? FREE, createdAt: user.created_at }
}

// "Premium active" = status active and not past its period end (if any).
export function isPremiumActive(sub: Subscription | null | undefined): boolean {
  if (!sub || sub.status !== 'active') return false
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false
  return true
}

// `isPremium` reflects a real paid subscription — it drives the premium *badge*.
// `hasFeatures` also includes the launch early-access promo — it drives feature
// *gates*, so early users get the features without showing a premium badge.
export function useSubscription() {
  const { data, isLoading } = useQuery({ queryKey: ['subscription'], queryFn: fetchSubState })
  const subscription = data?.subscription ?? null
  const isPremium = isPremiumActive(subscription)
  const hasFeatures = isPremium || isEarlyAccess(data?.createdAt)
  return { isPremium, hasFeatures, loading: isLoading, subscription }
}
