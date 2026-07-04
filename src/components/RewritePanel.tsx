"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  rewrites: {
    simple: string;
    web: string;
    business: string;
  };
  originalText: string;
}

const tabs = [
  { key: "simple" as const, label: "読みやすい版", icon: "📖" },
  { key: "web" as const, label: "Web記事向け", icon: "💻" },
  { key: "business" as const, label: "ビジネス文書", icon: "📋" },
];

export default function RewritePanel({ rewrites, originalText }: Props) {
  const [active, setActive] = useState<"simple" | "web" | "business">("simple");
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rewrites[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openModal = () => {
    setTitle("");
    setAgreed(false);
    setSubmitError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!agreed || !title.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          original: originalText,
          rewritten: rewrites[active],
          pattern: active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "投稿に失敗しました");
      setShowModal(false);
      setToast("公開しました（+10pt獲得）");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "white" }}
    >
      {/* Tabs */}
      <div
        className="flex"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--paper)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              borderBottom: active === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
              color: active === tab.key ? "var(--accent)" : "var(--ink-muted)",
              background: "transparent",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleCopy}
          className="px-4 py-3 text-xs font-medium transition-all"
          style={{ color: copied ? "var(--ok)" : "var(--ink-muted)" }}
        >
          {copied ? "✓ コピー済み" : "コピー"}
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <p
          className="text-sm leading-loose whitespace-pre-wrap"
          style={{ color: "var(--ink-soft)" }}
        >
          {rewrites[active]}
        </p>

        <div className="mt-4 flex justify-end">
          {isLoggedIn === false ? (
            <a
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
              style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
            >
              ログインすると公開投稿できます
            </a>
          ) : (
            <button
              onClick={openModal}
              disabled={isLoggedIn !== true}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: "var(--accent-light)",
                color: "var(--accent)",
                border: "1px solid #c7d9fb",
                opacity: isLoggedIn !== true ? 0.5 : 1,
                cursor: isLoggedIn !== true ? "not-allowed" : "pointer",
              }}
            >
              📢 公開事例として投稿
            </button>
          )}
        </div>
      </div>

      {/* 投稿確認モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(26,26,46,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-display font-bold" style={{ color: "var(--ink)" }}>
                公開事例として投稿
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <p
                className="text-xs leading-relaxed rounded-lg p-3"
                style={{ background: "var(--warn-bg)", color: "var(--warn)" }}
              >
                氏名・住所・電話番号・メールアドレス・会社名・顧客名・契約情報などの個人情報・機密情報を削除してから公開してください。公開後も削除できます
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  タイトル
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="例：職務経歴書の自己PR文"
                  className="w-full rounded-lg text-sm p-3 outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--ink)" }}
                />
              </div>

              <label className="flex items-start gap-2 text-xs" style={{ color: "var(--ink-soft)" }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                個人情報・機密情報を含まないことを確認しました
              </label>

              {submitError && (
                <p className="text-xs" style={{ color: "var(--error)" }}>
                  ⚠️ {submitError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!agreed || !title.trim() || submitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{
                    background: !agreed || !title.trim() || submitting ? "var(--ink-muted)" : "var(--accent)",
                    cursor: !agreed || !title.trim() || submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "投稿中..." : "投稿する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 投稿成功トースト */}
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
