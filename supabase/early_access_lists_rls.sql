-- Launch promo: early registrants get list FEATURES without the premium BADGE.
-- Mirrors the client's `hasFeatures = isPremium || isEarlyAccess` split at the
-- database level, so the RLS INSERT gate stops rejecting early users.
-- Run once in Supabase SQL Editor, AFTER lists_premium_rls.sql.
--
-- Keep the cutoff below in sync with EARLY_ACCESS_UNTIL in src/lib/subscription.ts.
-- To END the promo: set the cutoff to the real paid-launch date (early users
-- keep access), or revert the two policies to use public.is_premium again.
--
-- NOTE: this does NOT grant the premium badge. The badge is driven by
-- profiles.is_premium, which a trigger syncs from the subscriptions table only —
-- early-access users have no subscription row, so they stay badge-free.

-- "Can use list features" = real active subscription OR launch early-access.
-- security definer so it can read auth.users / subscriptions regardless of caller RLS.
create or replace function public.has_list_access(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    public.is_premium(uid)
    or exists (
      select 1 from auth.users u
      where u.id = uid
        and u.created_at < timestamptz '2027-01-01 00:00:00+00'
    );
$$;

-- ── Repoint the INSERT gates from is_premium → has_list_access ───────────────
drop policy if exists "Premium owner creates lists" on public.user_lists;
create policy "Owner with access creates lists"
  on public.user_lists for insert
  with check (auth.uid() = user_id and public.has_list_access(auth.uid()));

drop policy if exists "Premium owner adds list items" on public.user_list_items;
create policy "Owner with access adds list items"
  on public.user_list_items for insert
  with check (
    public.has_list_access(auth.uid())
    and exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid())
  );
