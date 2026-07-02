"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppIcon from "@/components/AppIcon";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="flex flex-col items-center gap-3 mb-8">
        <AppIcon size={48} />
        <h1 className="font-display font-bold" style={{ fontSize: "1.6rem", color: "var(--ink)" }}>
          ログイン
        </h1>
        <p className="text-sm text-center" style={{ color: "var(--ink-muted)" }}>
          メールアドレスにログイン用のリンクをお送りします。
        </p>
      </div>

      {status === "sent" ? (
        <div
          className="rounded-xl p-5 text-sm text-center"
          style={{ background: "var(--ok-bg)", color: "var(--ok)", border: "1px solid var(--border)" }}
        >
          <p className="font-medium mb-1">送信しました</p>
          <p>{email} 宛にログイン用リンクを送信しました。メールをご確認ください。</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ border: "1px solid var(--border)", background: "white", color: "var(--ink)" }}
            disabled={status === "sending"}
          />
          {status === "error" && (
            <p className="text-xs" style={{ color: "var(--error)" }}>
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 rounded-xl text-sm font-medium transition-opacity"
            style={{ background: "var(--accent)", color: "white", opacity: status === "sending" ? 0.6 : 1 }}
          >
            {status === "sending" ? "送信中..." : "ログインリンクを送る"}
          </button>
        </form>
      )}
    </main>
  );
}
