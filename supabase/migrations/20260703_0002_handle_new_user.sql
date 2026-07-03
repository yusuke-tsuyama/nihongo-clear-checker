-- ============================================================================
-- 20260703_0002_handle_new_user.sql
--
-- 【適用済み・記録目的】
-- このファイルは Supabase ダッシュボードの SQL Editor で既に手動実行済みの
-- SQL をそのまま記録したものである。再実行や自動適用を意図したものではない。
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
