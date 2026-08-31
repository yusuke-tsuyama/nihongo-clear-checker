import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

// analyze-writing/route.ts の OUTPUT_TRUNCATED_MESSAGE と値を一致させること
const OUTPUT_TRUNCATED_MESSAGE =
  "文章が長いため結果が途中で切れました。文章を分割してお試しください。";

const VALID_PATTERNS = ["simple", "web", "business"] as const;
type RewritePattern = (typeof VALID_PATTERNS)[number];

function isValidPattern(value: unknown): value is RewritePattern {
  return typeof value === "string" && (VALID_PATTERNS as readonly string[]).includes(value);
}

// 一覧APIで一度に返す件数の上限（ページネーションはPhase 7で対応）
const LIST_LIMIT = 50;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // rewrite_examples_select_public_or_own ポリシー範囲でSELECTされるが、
  // ログイン中ユーザー自身の非公開・削除済み投稿が紛れ込まないよう明示的に絞り込む
  const { data: rows, error: listError } = await supabase
    .from("rewrite_examples")
    .select("id, user_id, title, original_text, rewritten_text, rewrite_pattern, created_at")
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (listError) {
    console.error("公開事例一覧取得失敗:", listError);
    return NextResponse.json({ error: "一覧の取得に失敗しました" }, { status: 500 });
  }

  const exampleIds = (rows ?? []).map((row) => row.id);

  let voteCountById = new Map<string, number>();
  if (exampleIds.length > 0) {
    const { data: voteCounts, error: voteCountError } = await supabase.rpc(
      "get_public_vote_counts",
      { p_example_ids: exampleIds }
    );
    if (voteCountError) {
      // 投票数の取得に失敗しても一覧自体は返す（voteCountは0として扱う）
      console.error("投票数取得失敗:", voteCountError);
    } else {
      voteCountById = new Map(
        (voteCounts ?? []).map((v: { example_id: string; vote_count: number }) => [
          v.example_id,
          v.vote_count,
        ])
      );
    }
  }

  let displayNameByUserId = new Map<string, string | null>();
  const userIds = Array.from(new Set((rows ?? []).map((row) => row.user_id)));
  if (userIds.length > 0) {
    const { data: displayNames, error: displayNameError } = await supabase.rpc(
      "get_public_display_names",
      { p_user_ids: userIds }
    );
    if (displayNameError) {
      // ユーザー名の取得に失敗しても一覧自体は返す（authorNameは「匿名ユーザー」として扱う）
      console.error("ユーザー名取得失敗:", displayNameError);
    } else {
      displayNameByUserId = new Map(
        (displayNames ?? []).map((d: { user_id: string; display_name: string | null }) => [
          d.user_id,
          d.display_name,
        ])
      );
    }
  }

  const examples = (rows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    original_text: row.original_text,
    rewritten_text: row.rewritten_text,
    rewrite_pattern: row.rewrite_pattern,
    created_at: row.created_at,
    voteCount: voteCountById.get(row.id) ?? 0,
    isOwn: user?.id === row.user_id,
    authorName: displayNameByUserId.get(row.user_id) ?? "匿名ユーザー",
  }));

  let myVotedExampleIds: string[] = [];
  if (user) {
    const { data: myVotes, error: myVotesError } = await supabase
      .from("helpful_votes")
      .select("example_id")
      .eq("voter_id", user.id);
    if (myVotesError) {
      console.error("投票済み一覧取得失敗:", myVotesError);
    } else {
      myVotedExampleIds = (myVotes ?? []).map((v) => v.example_id);
    }
  }

  return NextResponse.json({ examples, myVotedExampleIds });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: { title?: unknown; original?: unknown; rewritten?: unknown; pattern?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { title, original, rewritten, pattern } = body;

  if (typeof title !== "string" || title.length < 1 || title.length > 100) {
    return NextResponse.json({ error: "タイトルは1〜100字で入力してください" }, { status: 400 });
  }
  if (typeof original !== "string" || original.length < 1 || original.length > 5000) {
    return NextResponse.json({ error: "元の文章は1〜5000字で入力してください" }, { status: 400 });
  }
  if (typeof rewritten !== "string" || rewritten.length < 1 || rewritten.length > 5000) {
    return NextResponse.json({ error: "リライト文は1〜5000字で入力してください" }, { status: 400 });
  }
  if (!isValidPattern(pattern)) {
    return NextResponse.json({ error: "patternが不正です" }, { status: 400 });
  }
  if (rewritten.includes(OUTPUT_TRUNCATED_MESSAGE)) {
    return NextResponse.json({ error: "途中で切れた結果は投稿できません" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_public_example", {
    p_title: title,
    p_original: original,
    p_rewritten: rewritten,
    p_pattern: pattern,
  });

  if (error) {
    console.error("create_public_example RPC失敗:", error);
    return NextResponse.json({ error: "投稿に失敗しました" }, { status: 500 });
  }

  const result = data as { example_id: string; points_awarded: boolean };

  return NextResponse.json({
    example_id: result.example_id,
    points_awarded: result.points_awarded,
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const url = new URL(req.url);
  let id = url.searchParams.get("id");

  if (!id) {
    try {
      const body = await req.json();
      if (typeof body?.id === "string") {
        id = body.id;
      }
    } catch {
      // クエリにidが無く、bodyも無い/不正な場合は下のバリデーションで弾く
    }
  }

  if (!id) {
    return NextResponse.json({ error: "idが必要です" }, { status: 400 });
  }

  // 本人の投稿かどうかの判定はRLS（rewrite_examples_update_own）に委ねる。
  // 他人の投稿IDを指定した場合はRLSにより0件更新となりerrorは出ない。
  const { error } = await supabase
    .from("rewrite_examples")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("投稿削除失敗:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
