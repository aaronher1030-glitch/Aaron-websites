-- ChemBank optional progress sync schema.
-- Run once in the Supabase SQL editor of the project referenced by
-- VITE_SUPABASE_URL. One row per user; the client upserts on user_id.
-- The anon key is public by design, so RLS below is what keeps each
-- notebook readable/writable only by its owner.

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
create policy "read own progress" on public.progress for select using (auth.uid() = user_id);
create policy "insert own progress" on public.progress for insert with check (auth.uid() = user_id);
create policy "update own progress" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
