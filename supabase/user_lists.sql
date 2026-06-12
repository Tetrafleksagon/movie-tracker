-- Custom user lists (collections of titles).
-- Run once in Supabase Dashboard -> SQL Editor.

create table public.user_lists (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now()
);

create table public.user_list_items (
  list_id  uuid        not null references public.user_lists (id) on delete cascade,
  tmdb_id  integer     not null,
  added_at timestamptz not null default now(),
  primary key (list_id, tmdb_id)
);

alter table public.user_lists enable row level security;
alter table public.user_list_items enable row level security;

-- Lists: owner has full access.
create policy "Owner manages lists"
  on public.user_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Items: access is granted through ownership of the parent list.
create policy "Owner reads list items"
  on public.user_list_items for select
  using (exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid()));

create policy "Owner adds list items"
  on public.user_list_items for insert
  with check (exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid()));

create policy "Owner removes list items"
  on public.user_list_items for delete
  using (exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid()));
