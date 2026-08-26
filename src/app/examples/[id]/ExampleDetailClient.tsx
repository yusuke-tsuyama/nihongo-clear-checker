"use client";

import { useState } from "react";

interface Props {
  exampleId: string;
  initialVoteCount: number;
  initialVoted: boolean;
  isOwn: boolean;
  isLoggedIn: boolean;
}

export default function ExampleDetailClient({
  exampleId,
  initialVoteCount,
  initialVoted,
  isOwn,
  isLoggedIn,
}: Props) {
  const [voted, setVoted] = useState(initialVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [voting, setVoting] = useState(false);

  const canVote = isLoggedIn && !voted && !isOwn;

  const handleVote = async () => {
    if (!canVote || voting) return;
    setVoting(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ example_id: exampleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "投票に失敗しました");
      setVoted(true);
      setVoteCount((prev) => prev + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "投票に失敗しました");
    } finally {
      setVoting(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!canVote || voting}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: voted ? "var(--ok-bg)" : "var(--paper)",
        color: voted ? "var(--ok)" : "var(--ink-soft)",
        border: `1px solid ${voted ? "var(--ok)" : "var(--border)"}`,
        opacity: !canVote && !voted ? 0.5 : 1,
        cursor: !canVote || voting ? "not-allowed" : "pointer",
      }}
    >
      {voted ? "✓ 投票済み" : "👍 参考になった"} {voteCount}
    </button>
  );
}
