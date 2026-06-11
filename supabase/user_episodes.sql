-- Episode-level watch progress for TV shows.
-- Run once in Supabase Dashboard -> SQL Editor.

create table public.user_episodes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  tmdb_id    integer     not null,
  season     integer     not null,
  episode    integer     not null,
  watched_at timestamptz not null default now(),
  primary key (user_id, tmdb_id, season, episode)
);

alter table public.user_episodes enable row level security;

-- Anyone can read progress (needed for shared/public library pages),
-- matching the visibility model of user_media.
create policy "Public read access"
  on public.user_episodes for select
  using (true);

-- Only the owner can modify their progress.
create policy "Owners insert their episodes"
  on public.user_episodes for insert
  with check (auth.uid() = user_id);

create policy "Owners delete their episodes"
  on public.user_episodes for delete
  using (auth.uid() = user_id);
