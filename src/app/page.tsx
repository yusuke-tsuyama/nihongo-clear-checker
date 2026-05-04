"use client";

import { useState, useEffect } from "react";
import { AnalysisResult } from "@/types";
import { saveDiagnosis } from "@/lib/supabase";
import AppIcon from "@/components/AppIcon";
import ScoreRing from "@/components/ScoreRing";
import CheckCard from "@/components/CheckCard";
import RewritePanel from "@/components/RewritePanel";
import HistoryPanel from "@/components/HistoryPanel";
import TermsModal from "@/components/TermsModal";
import Onboarding from "@/components/Onboarding";

const MAX_CHARS = 3000;

const SAMPLE_TEXT = `私が昨日、友人から聞いた話によると、最近、都市部において、特に若い世代を中心に、読書離れが急速に進んでいるということです。これは非常に深刻な問題だと思います。本を読まないということは、語彙力が低下するということです。語彙力が低下すると、思考力も低下します。思考力が低下すると、様々な問題が発生します。このような問題を解決するためには、学校教育の場において、読書を推進する取り組みを積極的に行っていく必要があると考えられます。`;

function LoadingCard() {
  return <div className="rounded-xl p-4 shimmer" style={{ height: 80 }} />;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [saved, setSaved] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<"onboarding" | "tutorial-only" | null>("onboarding");

  const handleOnboardingComplete = () => {
    setOnboardingMode(null);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました。");

      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);

      await saveDiagnosis({
        input_text: text.slice(0, 500),
        score: analysisResult.score,
        summary: analysisResult.summary,
        result_json: JSON.stringify(analysisResult),
      });
      setHistoryRefresh((n) => n + 1);

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = (loadedResult: AnalysisResult, loadedText: string) => {
    setResult(loadedResult);
    setText(loadedText);
    setShowHistory(false);
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSave = async () => {
    if (!result || !text) return;
    await saveDiagnosis({
      input_text: text.slice(0, 500),
      score: result.score,
      summary: result.summary,
      result_json: JSON.stringify(result),
    });
    setSaved(true);
    setHistoryRefresh((n) => n + 1);
    setTimeout(() => setSaved(false), 3000);
  };

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {onboardingMode && (
        <Onboarding mode={onboardingMode} onComplete={handleOnboardingComplete} />
      )}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(26,26,46,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowHistory(false)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: "white", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-display font-bold" style={{ color: "var(--ink)" }}>診断履歴</h2>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "var(--paper)", color: "var(--ink-muted)" }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <HistoryPanel onLoad={handleLoadHistory} refreshTrigger={historyRefresh} inModal />
            </div>
          </div>
        </div>
      )}

      <header style={{ borderBottom: "1px solid var(--border)", background: "white", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 60 }}>
          <div className="flex items-center gap-2.5">
            <AppIcon size={28} />
            <span className="font-display font-bold" style={{ color: "var(--ink)", fontSize: "1rem", letterSpacing: "0.02em" }}>
              日本語クリアチェッカー
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnboardingMode("tutorial-only")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}
            >
              💡 使い方
            </button>
