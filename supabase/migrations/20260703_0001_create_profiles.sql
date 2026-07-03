-- ============================================================================
-- 20260703_0001_create_profiles.sql
--
-- 【適用済み・記録目的】
-- このファイルは Supabase ダッシュボードの SQL Editor で既に手動実行済みの
-- SQL をそのまま記録したものである。再実行や自動適用を意図したものではない。
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  total_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);
