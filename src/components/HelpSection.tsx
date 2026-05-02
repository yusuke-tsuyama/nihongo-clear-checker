"use client";
import { useState } from "react";

const STEPS = [
  {
    icon: "✍️",
    title: "文章を入力",
    desc: "チェックしたい日本語文章をテキストエリアに貼り付けます。3000字以内が目安です。",
  },
  {
    icon: "🔍",
    title: "診断ボタンを押す",
    desc: "「文章を診断する」ボタンをクリックすると、AIが8つの観点から文章を分析します。",
  },
  {
    icon: "📊",
    title: "結果を確認",
    desc: "100点満点のスコアと、係り受け・読点・主語述語の距離などのチェック結果が表示されます。",
  },
  {
    icon: "📝",
    title: "リライト案を活用",
    desc: "「読みやすい版」「Web記事向け」「ビジネス文書版」の3種類のリライト案から選べます。",
  },
];

const CHECKS = [
  { name: "係り受け", desc: "修飾語と被修飾語の距離が適切か" },
  { name: "主語・述語", desc: "主語と述語が離れすぎていないか" },
  { name: "読点の位置", desc: "意味の切れ目に読点があるか" },
  { name: "一文の長さ", desc: "一文に情報を詰め込みすぎていないか" },
  { name: "指示語", desc: "「これ」「それ」が何を指すか明確か" },
  { name: "重複表現", desc: "同じ意味の繰り返しがないか" },
  { name: "文の順序", desc: "読者が一度で意味を取れる語順か" },
  { name: "読みやすさ", desc: "全体の流れが論理的か" },
];

export default function HelpSection() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "white" }}
    >
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
        style={{ background: "var(--accent-light)" }}
      >
        <div className="flex items-center gap-2">
          <span>💡</span>
          <span className="font-medium text-sm" style={{ color: "var(--accent)" }}>
            使い方ガイド — はじめての方へ
          </span>
        </div>
        <span style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
          {open ? "▲ 閉じる" : "▼ 開く"}
        </span>
      </button>

      {open && (
        <div className="px-5 py-5 space-y-6">
          {/* Steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
              使い方
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: "var(--paper)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: "var(--accent-light)" }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--ink)" }}>
                      {i + 1}. {step.title}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Check items */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
              チェック項目（8項目）
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {CHECKS.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--ink-soft)" }}>
                  <span style={{ color: "var(--accent)", marginTop: 1 }}>✓</span>
                  <span>
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>{c.name}</span>
                    {" — "}{c.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div
            className="rounded-xl p-4 text-xs leading-relaxed"
            style={{ background: "var(--paper-warm)", color: "var(--ink-soft)" }}
          >
            <span className="font-semibold" style={{ color: "var(--ink)" }}>💡 ヒント：</span>
            {" "}スコアが低くても落ち込まないでください。このツールは文章の「個性」を消すためではなく、
            読者が<strong>一度で意味を取れる</strong>文章に整えるためのものです。
            指摘はあくまで参考として活用してください。
          </div>
        </div>
      )}
    </div>
  );
}
