-- ============================================================================
-- 20260831_0007_display_name.sql
--
-- 【適用方法】
-- このマイグレーションは Supabase CLI では自動適用されない。
-- Supabase ダッシュボードの SQL Editor に本ファイルの内容を貼り付けて
-- 手動実行すること。
--
-- 【変更概要】
-- ユーザー表示名（display_name）の基盤を追加する。
-- - profiles テーブルに display_name 列（nullable, デフォルトなし）を追加
-- - 本人が自分の display_name を設定する RPC set_display_name を追加
--
-- profiles 本体の RLS（本人のみ SELECT）はこのマイグレーションでは変更しない。
-- display_name を他者に公開する（例: みんなの事例の投稿者名として表示する等）
-- 対応は後続フェーズで API 側の結合により行う方針のため、ここでは行わない。
-- ============================================================================

alter table public.profiles
  add column if not exists display_name text;

-- ============================================================================
-- RPC: set_display_name
--   本人の profiles.display_name を設定する。
--   trim後の文字数が1〜20文字でない場合（空白のみを含む）は例外を送出する。
--   戻り値: 更新後の display_name（text）
-- ============================================================================
create or replace function public.set_display_name(p_display_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_trimmed text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception '認証されていません';
  end if;

  v_trimmed := trim(p_display_name);
  if v_trimmed is null or char_length(v_trimmed) < 1 or char_length(v_trimmed) > 20 then
    raise exception '表示名は1〜20文字で入力してください';
  end if;

  update public.profiles
    set display_name = v_trimmed
    where id = v_user_id;

  return v_trimmed;
end;
$$;

revoke all on function public.set_display_name(text) from public;
grant execute on function public.set_display_name(text) to authenticated;
