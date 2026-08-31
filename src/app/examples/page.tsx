"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppIcon from "@/components/AppIcon";
import AuthStatus from "@/components/AuthStatus";

interface ExampleItem {
  id: string;
  title: string;
  original_text: string;
  rewritten_text: string;
  rewrite_pattern: "simple" | "web" | "business";
  created_at: string;
  voteCount: number;
  isOwn: boolean;
  authorName: string;
}

function truncate(text: string, length = 100) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function LoadingCard() {
  return <div className="rounded-2xl shimmer" style={{ height: 180 }} />;
}

function ExpandableText({
  text,
  expanded,
  onToggle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isTruncatable = text.length > 100;
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>
      {expanded ? text : truncate(text)}
      {isTruncatable && (
        <button
          onClick={onToggle}
          className="ml-1 text-xs font-medium"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "閉じる ▴" : "続きを読む ▾"}
        </button>
      )}
    </p>
  );
}

export default function ExamplesPage() {
  const [examples, setExamples] = useState<ExampleItem[] | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/examples")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "一覧の取得に失敗しました");
        return data as { examples: ExampleItem[]; myVotedExampleIds: string[] };
      })
      .then((data) => {
        if (cancelled) return;
        setExamples(data.examples);
        setVotedIds(new Set(data.myVotedExampleIds ?? []));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "一覧の取得に失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVote = async (id: string) => {
    if (votingId) return;
    setVotingId(id);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ example_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "投票に失敗しました");
      setVotedIds((prev) => new Set(prev).add(id));
      setExamples(
        (prev) => prev?.map((ex) => (ex.id === id ? { ...ex, voteCount: ex.voteCount + 1 } : ex)) ?? prev
      );
      setToast("投稿者に+3ptを贈りました");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "投票に失敗しました");
    } finally {
      setVotingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!window.confirm("この投稿を削除しますか？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/examples?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "削除に失敗しました");
      setExamples((prev) => prev?.filter((ex) => ex.id !== id) ?? prev);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
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
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
            >
              ← 診断に戻る
            </a>
            <AuthStatus />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="space-y-2 py-2">
          <h1 className="font-display font-bold" style={{ fontSize: "1.5rem", color: "var(--ink)" }}>
            📚 みんなの事例
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            公開されたリライト事例を見て、書き方の参考にしましょう。
          </p>
        </div>

        {error && (
          <div className="rounded-xl p-4 text-sm" style={{ background: "var(--error-bg)", color: "var(--error)", border: "1px solid #fca5a5" }}>
            ⚠️ {error}
          </div>
        )}

        {examples === null && !error && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        )}

        {examples !== null && examples.length === 0 && (
          <div className="text-sm text-center py-20" style={{ color: "var(--ink-muted)" }}>
            まだ公開事例がありません
          </div>
        )}

        {examples !== null && examples.length > 0 && (
          <div className="space-y-4">
            {examples.map((ex) => {
              const voted = votedIds.has(ex.id);
              const canVote = isLoggedIn === true && !voted && !ex.isOwn;
              return (
                <div
                  key={ex.id}
                  className="rounded-2xl p-5"
                  style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 4px var(--shadow)" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="font-display font-bold" style={{ fontSize: "1.05rem" }}>
                      <a
                        href={`/examples/${ex.id}`}
                        className="inline-block px-2 py-1 -mx-2 -my-1 rounded-lg transition-colors hover:bg-[var(--accent-light)]"
                        style={{ color: "var(--ink)" }}
                      >
                        {ex.title}
                      </a>
                    </h2>
                  </div>
                  <div className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
                    by {ex.authorName}
                  </div>

                  <div className="mb-4">
                    <div>
                      <div className="text-lg font-semibold mb-1.5" style={{ color: "var(--accent)" }}>元の文章</div>
                      <ExpandableText
                        text={ex.original_text}
                        expanded={expandedKeys.has(`${ex.id}-original`)}
                        onToggle={() => toggleExpanded(`${ex.id}-original`)}
                      />
                    </div>
                    <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="text-lg font-semibold mb-1.5" style={{ color: "var(--accent)" }}>リライト後</div>
                      <ExpandableText
                        text={ex.rewritten_text}
                        expanded={expandedKeys.has(`${ex.id}-rewritten`)}
                        onToggle={() => toggleExpanded(`${ex.id}-rewritten`)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{formatDate(ex.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(ex.id)}
                        disabled={!canVote || votingId === ex.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          background: voted ? "var(--ok-bg)" : "var(--paper)",
                          color: voted ? "var(--ok)" : "var(--ink-soft)",
                          border: `1px solid ${voted ? "var(--ok)" : "var(--border)"}`,
                          opacity: !canVote && !voted ? 0.5 : 1,
                          cursor: !canVote || votingId === ex.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {voted ? "✓ 投票済み" : "👍 参考になった"} {ex.voteCount}
                      </button>
                      {ex.isOwn && (
                        <button
                          onClick={() => handleDelete(ex.id)}
                          disabled={deletingId === ex.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "var(--paper)", color: "var(--error)", border: "1px solid var(--border)" }}
                        >
                          {deletingId === ex.id ? "削除中..." : "🗑️ 削除"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {toast && (
        <div
          className="fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
          style={{ background: "var(--ok)" }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
