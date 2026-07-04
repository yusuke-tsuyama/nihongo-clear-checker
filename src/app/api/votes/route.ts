import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: { example_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { example_id: exampleId } = body;
  if (typeof exampleId !== "string" || !exampleId) {
    return NextResponse.json({ error: "example_idが必要です" }, { status: 400 });
  }

  const { data: voteId, error } = await supabase.rpc("add_helpful_vote", {
    p_example_id: exampleId,
  });

  if (error) {
    // add_helpful_vote RPC内のraise exceptionメッセージで簡易分岐する
    const message = error.message || "投票に失敗しました";
    if (message.includes("投票済み") || message.includes("自分の投稿")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes("見つかりません")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("add_helpful_vote RPC失敗:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ vote_id: voteId });
}
