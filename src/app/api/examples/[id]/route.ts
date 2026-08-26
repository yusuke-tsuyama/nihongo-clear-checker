import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "事例が見つかりません" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // rewrite_examples_select_public_or_own ポリシー範囲でSELECTされるが、
  // ログイン中ユーザー自身の非公開・削除済み投稿が紛れ込まないよう明示的に絞り込む
  const { data: row, error: rowError } = await supabase
    .from("rewrite_examples")
    .select("id, user_id, title, original_text, rewritten_text, rewrite_pattern, created_at")
    .eq("id", id)
    .eq("is_public", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (rowError) {
    console.error("公開事例取得失敗:", rowError);
    return NextResponse.json({ error: "事例の取得に失敗しました" }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "事例が見つかりません" }, { status: 404 });
  }

  const { data: voteCounts, error: voteCountError } = await supabase.rpc(
    "get_public_vote_counts",
    { p_example_ids: [row.id] }
  );
  if (voteCountError) {
    // 投票数の取得に失敗しても本体は返す（voteCountは0として扱う）
    console.error("投票数取得失敗:", voteCountError);
  }
  const voteCount = voteCounts?.[0]?.vote_count ?? 0;

  let voted = false;
  if (user) {
    const { data: myVote, error: myVoteError } = await supabase
      .from("helpful_votes")
      .select("id")
      .eq("example_id", row.id)
      .eq("voter_id", user.id)
      .maybeSingle();
    if (myVoteError) {
      console.error("投票済み判定取得失敗:", myVoteError);
    } else {
      voted = !!myVote;
    }
  }

  return NextResponse.json({
    example: {
      id: row.id,
      title: row.title,
      original_text: row.original_text,
      rewritten_text: row.rewritten_text,
      rewrite_pattern: row.rewrite_pattern,
      created_at: row.created_at,
      voteCount,
      isOwn: user?.id === row.user_id,
    },
    voted,
  });
}
