-- Mirror premium status into the public profiles table so it's visible to
-- OTHER users (share pages) — subscriptions itself is read-own-only by RLS.
-- A trigger keeps profiles.is_premium in sync with subscriptions automatically
-- (works for manual grants now and the payment webhook later).
-- Run once in Supabase SQL Editor, after profiles.sql + subscriptions.sql.

alter table public.profiles add column if not exists is_premium boolean not null default false;

create or replace function public.sync_profile_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
    set is_premium = (new.status = 'active' and (new.current_period_end is null or new.current_period_end > now()))
    where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_subscription_change on public.subscriptions;
create trigger on_subscription_change
  after insert or update on public.subscriptions
  for each row execute function public.sync_profile_premium();

-- Backfill from existing subscriptions.
update public.profiles p
  set is_premium = true
  from public.subscriptions s
  where s.user_id = p.id
    and s.status = 'active'
    and (s.current_period_end is null or s.current_period_end > now());
