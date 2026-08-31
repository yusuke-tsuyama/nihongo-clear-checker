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

  let body: { displayName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { displayName } = body;
  if (typeof displayName !== "string") {
    return NextResponse.json({ error: "displayNameが必要です" }, { status: 400 });
  }

  const { data: updatedName, error } = await supabase.rpc("set_display_name", {
    p_display_name: displayName,
  });

  if (error) {
    // set_display_name RPC内のraise exceptionメッセージ（文字数バリデーション等）をそのまま返す
    return NextResponse.json({ error: error.message || "ユーザー名の保存に失敗しました" }, { status: 400 });
  }

  return NextResponse.json({ displayName: updatedName });
}
