"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RANK_ICONS: Record<string, string> = {
  Beginner: "🌱",
  Bronze: "🥉",
};

interface RankInfo {
  rank: string;
  totalPoints: number;
  isLoggedIn: boolean;
}

function RankBadge({ info }: { info: RankInfo }) {
  if (!info.isLoggedIn) {
    return (
      <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
        👤 ゲスト
      </span>
    );
  }
  const icon = RANK_ICONS[info.rank] ?? "👤";
  return (
    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
      {icon} {info.rank}・{info.totalPoints}pt
    </span>
  );
}

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);

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

  useEffect(() => {
    fetch("/api/me/entitlements")
      .then((res) => res.json())
      .then((data) => {
        setRankInfo({
          rank: data?.rank ?? "Guest",
          totalPoints: data?.totalPoints ?? 0,
          isLoggedIn: !!data?.isLoggedIn,
        });
      })
      .catch(() => setRankInfo({ rank: "Guest", totalPoints: 0, isLoggedIn: false }));
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
      <div className="flex items-center gap-2 flex-wrap">
        {rankInfo && <RankBadge info={rankInfo} />}
        <a
          href="/login"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
        >
          ログイン
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs hidden sm:block" style={{ color: "var(--ink-muted)" }}>
        {email}
      </span>
      {rankInfo && <RankBadge info={rankInfo} />}
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
