-- Custom avatar uploads → Supabase Storage bucket `avatars`.
-- Read is public (avatars appear on public share pages).
-- Write/delete is gated by has_list_access() — the same "hasFeatures" gate as
-- custom lists, so real premium AND early-access users can upload; guests and
-- late-signup free users cannot.
--
-- Path convention: `avatars/{user_id}.webp` — one file per user, upsert on
-- change. The file name IS the user id so RLS can match owner without any
-- extra metadata.
--
-- Run once in Supabase SQL Editor, AFTER early_access_lists_rls.sql (which
-- defines has_list_access).

-- Public bucket so <img src> works without signed URLs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Object path lives in storage.objects.name. Convention:
--   "<uuid>.webp"           → owner-matched by name = auth.uid()::text || '.webp'
-- The extension is fixed at .webp because we always encode to WebP on the client.

-- ── SELECT (read) ────────────────────────────────────────────────────────────
-- Public read (bucket.public already allows this, but RLS still applies to
-- storage.objects; a permissive policy makes it explicit).
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── INSERT (upload) ──────────────────────────────────────────────────────────
drop policy if exists "Users with access upload own avatar" on storage.objects;
create policy "Users with access upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and public.has_list_access(auth.uid())
    and name = auth.uid()::text || '.webp'
  );

-- ── UPDATE (overwrite via upsert) ────────────────────────────────────────────
drop policy if exists "Users with access update own avatar" on storage.objects;
create policy "Users with access update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name = auth.uid()::text || '.webp'
  )
  with check (
    bucket_id = 'avatars'
    and public.has_list_access(auth.uid())
    and name = auth.uid()::text || '.webp'
  );

-- ── DELETE ───────────────────────────────────────────────────────────────────
drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name = auth.uid()::text || '.webp'
  );
