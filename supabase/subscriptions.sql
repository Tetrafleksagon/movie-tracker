-- Subscription / entitlement layer.
-- Run once in Supabase Dashboard -> SQL Editor.

create table public.subscriptions (
  user_id            uuid        primary key references auth.users (id) on delete cascade,
  status             text        not null default 'inactive',  -- 'active' | 'inactive'
  plan               text,                                      -- e.g. 'premium'
  current_period_end timestamptz,                               -- null = no expiry (manual grant)
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users may READ only their own subscription. There are intentionally NO
-- insert/update/delete policies, so clients cannot grant themselves premium —
-- only the service role (dashboard now, payment webhook later) can write here.
create policy "Read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);


-- ── Manually grant premium to an account (run separately) ───────────────────
-- Find the user id in Dashboard -> Authentication -> Users, then:
--
-- insert into public.subscriptions (user_id, status, plan)
-- values ('PASTE-USER-UUID', 'active', 'premium')
-- on conflict (user_id) do update
--   set status = 'active', plan = 'premium', current_period_end = null, updated_at = now();
--
-- To revoke:
-- update public.subscriptions set status = 'inactive', updated_at = now()
-- where user_id = 'PASTE-USER-UUID';
