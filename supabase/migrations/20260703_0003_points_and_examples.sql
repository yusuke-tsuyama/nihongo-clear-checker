-- ============================================================================
-- 20260703_0003_points_and_examples.sql
--
-- 【適用方法】
-- このマイグレーションは Supabase CLI では自動適用されない。
-- Supabase ダッシュボードの SQL Editor に本ファイルの内容を貼り付けて
-- 手動実行すること。
--
-- 【ポイント値について】
-- ポイント付与量（+3 / +10 など）は各 RPC 関数内で PL/pgSQL の
-- CONSTANT として定義し、コメントでも明記する。
-- アプリ側（TypeScript）でのポイント値の一元管理・同期は Phase 2 で対応する。
-- 現時点では本 SQL ファイルの定数値が唯一の正とする。
--
-- 前提: public.profiles(id uuid primary key ...) が既に存在すること。
-- ============================================================================


-- ============================================================================
-- ① point_events: ポイント付与履歴
-- ============================================================================
create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null,
  source_type text not null,
  source_id uuid,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.point_events enable row level security;

-- SELECT: 本人の履歴のみ閲覧可能
create policy "point_events_select_own"
  on public.point_events
  for select
  using (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE ポリシーは意図的に作成しない。
-- 書き込みは SECURITY DEFINER の RPC 関数経由のみとする。


-- ============================================================================
-- ② rewrite_examples: 公開リライト例文
-- ============================================================================
create table if not exists public.rewrite_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  original_text text not null,
  rewritten_text text not null,
  rewrite_pattern text not null check (rewrite_pattern in ('simple', 'web', 'business')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.rewrite_examples enable row level security;

-- SELECT: 公開かつ未削除の投稿、または本人の投稿のみ
create policy "rewrite_examples_select_public_or_own"
  on public.rewrite_examples
  for select
  using (
    (is_public = true and deleted_at is null)
    or auth.uid() = user_id
  );

-- INSERT / UPDATE / DELETE: 本人のみ
create policy "rewrite_examples_insert_own"
  on public.rewrite_examples
  for insert
  with check (auth.uid() = user_id);

create policy "rewrite_examples_update_own"
  on public.rewrite_examples
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rewrite_examples_delete_own"
  on public.rewrite_examples
  for delete
  using (auth.uid() = user_id);


-- ============================================================================
-- ③ helpful_votes: 「参考になった」投票
-- ============================================================================
create table if not exists public.helpful_votes (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references public.rewrite_examples(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (example_id, voter_id)
);

alter table public.helpful_votes enable row level security;

-- SELECT: 認証済みユーザー全員が閲覧可能（投票数の表示用）
create policy "helpful_votes_select_authenticated"
  on public.helpful_votes
  for select
  using (auth.role() = 'authenticated');

-- INSERT / UPDATE / DELETE ポリシーは意図的に作成しない。
-- 投票は add_helpful_vote RPC 経由のみとする（直接 INSERT 不可）。


-- ============================================================================
-- ④ ai_usage_logs: AI 呼び出しログ（クライアントから一切アクセス不可）
-- ============================================================================
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  request_id text not null,
  mode text not null,
  rewrite_pattern text,
  input_chars integer,
  output_chars integer,
  input_tokens integer,
  output_tokens integer,
  model text,
  max_tokens integer,
  duration_ms integer,
  success boolean not null,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_logs enable row level security;

-- クライアント向けポリシーは一切作成しない。
-- 書き込み・読み取りはサーバー側（service role キー）からのみ行う。


-- ============================================================================
-- ⑤ RPC: add_helpful_vote
--   「参考になった」投票を登録し、投稿者に +3pt を付与する。
--   自分自身の投稿には投票できない。二重投票は unique 制約で防止する。
-- ============================================================================
create or replace function public.add_helpful_vote(p_example_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_points_helpful_vote constant integer := 3; -- ポイント定数: 投票獲得 +3pt
  v_voter_id uuid;
  v_author_id uuid;
  v_is_public boolean;
  v_deleted_at timestamptz;
  v_vote_id uuid;
begin
  v_voter_id := auth.uid();
  if v_voter_id is null then
    raise exception '認証されていません';
  end if;

  select user_id, is_public, deleted_at
    into v_author_id, v_is_public, v_deleted_at
    from public.rewrite_examples
    where id = p_example_id;

  if v_author_id is null then
    raise exception '投稿が見つかりません';
  end if;

  if v_is_public is not true or v_deleted_at is not null then
    raise exception '投稿が見つかりません';
  end if;

  if v_author_id = v_voter_id then
    raise exception '自分の投稿には投票できません';
  end if;

  begin
    insert into public.helpful_votes (example_id, voter_id)
    values (p_example_id, v_voter_id)
    returning id into v_vote_id;
  exception
    when unique_violation then
      raise exception '投票済みです';
  end;

  -- 投票の登録に成功した場合のみポイントを付与する
  insert into public.point_events (user_id, points, reason, source_type, source_id, idempotency_key)
  values (
    v_author_id,
    c_points_helpful_vote,
    'helpful_vote_received',
    'helpful_vote',
    v_vote_id,
    'helpful:' || v_vote_id
  );

  update public.profiles
    set total_points = total_points + c_points_helpful_vote
    where id = v_author_id;

  return v_vote_id;
end;
$$;

revoke all on function public.add_helpful_vote(uuid) from public;
grant execute on function public.add_helpful_vote(uuid) to authenticated;


-- ============================================================================
-- ⑥ RPC: create_public_example
--   リライト例文を公開投稿し、投稿者に +10pt を付与する。
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
  v_user_id uuid;
  v_example_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception '認証されていません';
  end if;

  insert into public.rewrite_examples (user_id, title, original_text, rewritten_text, rewrite_pattern, is_public)
  values (v_user_id, p_title, p_original, p_rewritten, p_pattern, true)
  returning id into v_example_id;

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

  return v_example_id;
end;
$$;

revoke all on function public.create_public_example(text, text, text, text) from public;
grant execute on function public.create_public_example(text, text, text, text) to authenticated;
