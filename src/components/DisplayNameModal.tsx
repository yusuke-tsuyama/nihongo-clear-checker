"use client";
import { useEffect, useState } from "react";

interface Props {
  displayName: string | null;
  onClose: () => void;
  onSaved: (newName: string) => void;
}

const MIN_LENGTH = 1;
const MAX_LENGTH = 20;

export default function DisplayNameModal({ displayName, onClose, onSaved }: Props) {
  const [value, setValue] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const trimmed = value.trim();
  const isValid = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/display-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "ユーザー名の保存に失敗しました");
        return;
      }
      onSaved(data.displayName as string);
      onClose();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,46,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "white", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--ink)" }}>
            ユーザー名の設定
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lg"
            style={{ background: "var(--paper)", color: "var(--ink-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={MAX_LENGTH + 10}
            placeholder="ユーザー名を入力"
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--ink)" }}
          />
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: !isValid && trimmed.length > 0 ? "var(--accent)" : "var(--ink-muted)" }}>
              {trimmed.length}/{MAX_LENGTH}文字
            </span>
            {error && <span style={{ color: "#dc2626" }}>{error}</span>}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="px-6 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--accent)", opacity: !isValid || saving ? 0.5 : 1 }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
