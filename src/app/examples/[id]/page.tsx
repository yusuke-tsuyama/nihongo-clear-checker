import { cache } from "react";
import type { Metadata } from "next";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import AppIcon from "@/components/AppIcon";
import AuthStatus from "@/components/AuthStatus";
import ExampleDetailClient from "./ExampleDetailClient";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ExampleDetail {
  id: string;
  title: string;
  original_text: string;
  rewritten_text: string;
  rewrite_pattern: "simple" | "web" | "business";
  created_at: string;
  voteCount: number;
  isOwn: boolean;
  voted: boolean;
  isLoggedIn: boolean;
  authorName: string;
}

// generateMetadataとページ本体の両方から呼ばれるため、
// react cacheでリクエスト単位にメモ化しDBアクセスを1回にまとめる
const getExample = cache(async (id: string): Promise<ExampleDetail | null> => {
  if (!UUID_RE.test(id)) return null;

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
    return null;
  }
  if (!row) return null;

  const { data: voteCounts, error: voteCountError } = await supabase.rpc(
    "get_public_vote_counts",
    { p_example_ids: [row.id] }
  );
  if (voteCountError) {
    // 投票数の取得に失敗しても本体は返す（voteCountは0として扱う）
    console.error("投票数取得失敗:", voteCountError);
  }
  const voteCount = voteCounts?.[0]?.vote_count ?? 0;

  const { data: displayNames, error: displayNameError } = await supabase.rpc(
    "get_public_display_names",
    { p_user_ids: [row.user_id] }
  );
  if (displayNameError) {
    // ユーザー名の取得に失敗しても本体は返す（authorNameは「匿名ユーザー」として扱う）
    console.error("ユーザー名取得失敗:", displayNameError);
  }
  const authorName = displayNames?.[0]?.display_name ?? "匿名ユーザー";

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

  return {
    id: row.id,
    title: row.title,
    original_text: row.original_text,
    rewritten_text: row.rewritten_text,
    rewrite_pattern: row.rewrite_pattern,
    created_at: row.created_at,
    voteCount,
    isOwn: user?.id === row.user_id,
    voted,
    isLoggedIn: !!user,
    authorName,
  };
});

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const example = await getExample(params.id);

  if (!example) {
    return { title: "事例が見つかりません | 日本語クリアチェッカー" };
  }

  const title = `${example.title} | 日本語クリアチェッカー`;
  const description =
    example.original_text.length > 80
      ? `${example.original_text.slice(0, 80)}…`
      : example.original_text;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function Header() {
  return (
    <header style={{ borderBottom: "1px solid var(--border)", background: "white", position: "sticky", top: 0, zIndex: 40 }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 60 }}>
        <a href="/" className="flex items-center gap-2.5">
          <AppIcon size={28} />
          <span className="font-display font-bold" style={{ color: "var(--ink)", fontSize: "1rem", letterSpacing: "0.02em" }}>
            日本語クリアチェッカー
          </span>
        </a>
        <div className="flex items-center gap-2">
          <a
            href="/examples"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
          >
            ← 一覧に戻る
          </a>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}

export default async function ExampleDetailPage({ params }: { params: { id: string } }) {
  const example = await getExample(params.id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {!example && (
          <div className="text-sm text-center py-20" style={{ color: "var(--ink-muted)" }}>
            事例が見つかりません
          </div>
        )}

        {example && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 4px var(--shadow)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <h1 className="font-display font-bold" style={{ color: "var(--ink)", fontSize: "1.3rem" }}>
                {example.title}
              </h1>
            </div>
            <div className="text-xs mb-5" style={{ color: "var(--ink-muted)" }}>
              by {example.authorName}
            </div>

            <div className="mb-6">
              <div>
                <div className="font-display font-bold text-lg mb-1.5" style={{ color: "var(--accent)" }}>元の文章</div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>
                  {example.original_text}
                </p>
              </div>
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="font-display font-bold text-lg mb-1.5" style={{ color: "var(--accent)" }}>リライト後</div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>
                  {example.rewritten_text}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{formatDate(example.created_at)}</span>
              <ExampleDetailClient
                exampleId={example.id}
                initialVoteCount={example.voteCount}
                initialVoted={example.voted}
                isOwn={example.isOwn}
                isLoggedIn={example.isLoggedIn}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
