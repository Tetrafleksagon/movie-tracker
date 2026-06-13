-- A3: enforce "lists are premium" at the database level (RLS), so the UI gate
-- can't be bypassed via DevTools. Run once in Supabase SQL Editor, AFTER
-- subscriptions.sql and user_lists.sql.
--
-- Rule: any signed-in owner may READ and DELETE their lists/items, but only an
-- active-premium owner may CREATE lists or ADD items. (Downgraded users keep
-- and can clean up what they already have.)

-- Premium check (security definer so it can read subscriptions regardless of caller RLS).
create or replace function public.is_premium(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- ── user_lists ──────────────────────────────────────────────────────────────
drop policy if exists "Owner manages lists" on public.user_lists;

create policy "Owner reads lists"
  on public.user_lists for select
  using (auth.uid() = user_id);

create policy "Premium owner creates lists"
  on public.user_lists for insert
  with check (auth.uid() = user_id and public.is_premium(auth.uid()));

create policy "Owner deletes lists"
  on public.user_lists for delete
  using (auth.uid() = user_id);

-- ── user_list_items ─────────────────────────────────────────────────────────
-- Replace only the INSERT policy; keep the existing read/delete policies.
drop policy if exists "Owner adds list items" on public.user_list_items;

create policy "Premium owner adds list items"
  on public.user_list_items for insert
  with check (
    public.is_premium(auth.uid())
    and exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid())
  );
