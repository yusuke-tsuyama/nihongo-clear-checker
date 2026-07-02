"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoaded(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    window.location.reload();
  };

  if (!loaded) return null;

  if (!email) {
    return (
      <a
        href="/login"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
      >
        ログイン
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs hidden sm:block" style={{ color: "var(--ink-muted)" }}>
        {email}
      </span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
      >
        ログアウト
      </button>
    </div>
  );
}
