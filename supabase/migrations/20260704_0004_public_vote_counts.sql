-- ============================================================================
-- 20260704_0004_public_vote_counts.sql
--
-- 【適用方法】
-- このマイグレーションは Supabase CLI では自動適用されない。
-- Supabase ダッシュボードの SQL Editor に本ファイルの内容を貼り付けて
-- 手動実行すること。
--
-- 【目的】
-- helpful_votes は voter_id（投票者個人を特定できる情報）を含むため、
-- anon ロールからの直接 SELECT は許可しない（既存方針を維持）。
-- 一方で公開事例一覧では example_id ごとの投票「数」だけを表示したいため、
-- 集計結果のみを返す RPC を新設し、これだけを anon / authenticated に公開する。
--
-- 前提: 20260703_0003_points_and_examples.sql が適用済みであること。
-- ============================================================================


-- ============================================================================
-- RPC: get_public_vote_counts
--   指定された example_id 群について、公開かつ未削除の投稿に限定して
--   投票数（vote_count）のみを集計して返す。voter_id 等の個人情報は一切返さない。
-- ============================================================================
create or replace function public.get_public_vote_counts(p_example_ids uuid[])
returns table (example_id uuid, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select hv.example_id, count(*)::bigint as vote_count
  from public.helpful_votes hv
  join public.rewrite_examples re on re.id = hv.example_id
  where hv.example_id = any(p_example_ids)
    and re.is_public = true
    and re.deleted_at is null
  group by hv.example_id;
$$;

revoke all on function public.get_public_vote_counts(uuid[]) from public;
grant execute on function public.get_public_vote_counts(uuid[]) to anon, authenticated;
