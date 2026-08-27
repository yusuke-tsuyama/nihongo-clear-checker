-- ============================================================================
-- 20260827_0004_limit_example_points.sql
--
-- 【適用方法】
-- このマイグレーションは Supabase CLI では自動適用されない。
-- Supabase ダッシュボードの SQL Editor に本ファイルの内容を貼り付けて
-- 手動実行すること。
--
-- 【目的】
-- 公開投稿によるポイント乱造対策。
-- 当日（日本時間 Asia/Tokyo の暦日）に public_example_created 理由で
-- 獲得したポイントが既に3件ある場合、4件目以降の投稿は
-- 投稿自体（rewrite_examples へのINSERT）は従来通り成功させるが、
-- ポイント付与（point_events のINSERT・profiles.total_points の更新）はスキップする。
--
-- 関数のシグネチャ・戻り値（example_id）・呼び出し側インターフェースは
-- 一切変更しない。アプリ側（TypeScript）の改修は不要。
-- ============================================================================

-- ============================================================================
-- RPC: create_public_example（再定義）
--   リライト例文を公開投稿する。
--   当日の public_example_created 件数が3件未満の場合のみ +10pt を付与する。
-- ============================================================================
create or replace function public.create_public_example(
  p_title text,
  p_original text,
  p_rewritten text,
  p_pattern text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_points_public_example constant integer := 10; -- ポイント定数: 公開投稿 +10pt
  c_daily_point_limit constant integer := 3; -- 1日あたりのポイント付与上限件数
  v_user_id uuid;
  v_example_id uuid;
  v_today_jst date;
  v_today_point_count integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception '認証されていません';
  end if;

  -- 投稿は常に成功させる（ポイント制限の対象外）
  insert into public.rewrite_examples (user_id, title, original_text, rewritten_text, rewrite_pattern, is_public)
  values (v_user_id, p_title, p_original, p_rewritten, p_pattern, true)
  returning id into v_example_id;

  -- 当日（Asia/Tokyo の暦日）に public_example_created で獲得した件数をカウント
  v_today_jst := (now() at time zone 'Asia/Tokyo')::date;

  select count(*)
    into v_today_point_count
    from public.point_events
    where user_id = v_user_id
      and reason = 'public_example_created'
      and (created_at at time zone 'Asia/Tokyo')::date = v_today_jst;

  -- 当日3件未満の場合のみポイントを付与する（4件目以降は投稿のみ・ポイント0）
  if v_today_point_count < c_daily_point_limit then
    insert into public.point_events (user_id, points, reason, source_type, source_id, idempotency_key)
    values (
      v_user_id,
      c_points_public_example,
      'public_example_created',
      'rewrite_example',
      v_example_id,
      'example:' || v_example_id
    );

    update public.profiles
      set total_points = total_points + c_points_public_example
      where id = v_user_id;
  end if;

  return v_example_id;
end;
$$;

revoke all on function public.create_public_example(text, text, text, text) from public;
grant execute on function public.create_public_example(text, text, text, text) to authenticated;
