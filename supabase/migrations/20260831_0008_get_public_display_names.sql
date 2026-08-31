-- ============================================================================
-- 20260831_0008_get_public_display_names.sql
--
-- 【適用方法】
-- このマイグレーションは Supabase CLI では自動適用されない。
-- Supabase ダッシュボードの SQL Editor に本ファイルの内容を貼り付けて
-- 手動実行すること。
--
-- 【目的・設計方針】
-- profiles は RLS により本人のみ SELECT 可能であり、これは変更しない。
-- 一方で「みんなの事例」等の公開一覧では、投稿者の display_name のみを
-- 未ログイン（anon）状態でも表示したい。そこで 20260704_0004_public_vote_counts.sql
-- の get_public_vote_counts と同じ設計（SECURITY DEFINER の集計専用 RPC を
-- 新設し、これだけを anon / authenticated に公開する）を踏襲し、
-- profiles と rewrite_examples を結合した上で display_name のみを返す
-- RPC を新設する。
--
-- - 対象は rewrite_examples.is_public = true かつ deleted_at is null の
--   投稿を持つ投稿者に限定する（非公開投稿しか持たないユーザーの
--   display_name は返さない）。
-- - email, total_points 等 display_name 以外の profiles の列は一切返さない。
-- - display_name が null の投稿者も user_id は返す。UI側で「匿名ユーザー」
--   等にフォールバック表示するための想定。
--
-- 前提: 20260703_0003_points_and_examples.sql, 20260831_0007_display_name.sql
-- が適用済みであること。
-- ============================================================================


-- ============================================================================
-- RPC: get_public_display_names
--   指定された user_id 群のうち、公開かつ未削除の投稿を持つ投稿者について
--   display_name のみを返す。email・total_points 等の個人情報は一切返さない。
-- ============================================================================
create or replace function public.get_public_display_names(p_user_ids uuid[])
returns table (user_id uuid, display_name text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct p.id as user_id, p.display_name
  from public.profiles p
  join public.rewrite_examples re on re.user_id = p.id
  where p.id = any(p_user_ids)
    and re.is_public = true
    and re.deleted_at is null;
$$;

revoke all on function public.get_public_display_names(uuid[]) from public;
grant execute on function public.get_public_display_names(uuid[]) to anon, authenticated;
