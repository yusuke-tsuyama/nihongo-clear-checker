"use client";
import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export default function TermsModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,46,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: "white", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--ink)" }}>
            利用規約
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
        <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm" style={{ color: "var(--ink-soft)", lineHeight: 1.9 }}>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>最終更新日：2025年1月1日</p>

          <section>
            <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第1条（サービスの目的）</h3>
            <p>本サービス「日本語クリアチェッカー」（以下「本サービス」）は、合同会社リベルダード（以下「当社」）が提供する日本語文章の診断・改善支援ツールです。ユーザーが入力した文章をAIが分析し、読みやすさの観点から改善提案を行うことを目的としています。</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第2条（利用条件）</h3>
            <p>本サービスは、以下の条件に同意した方がご利用いただけます。</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>個人情報・機密情報を含む文章の入力はご遠慮ください</li>
              <li>第三者の著作権を侵害するコンテンツの入力を禁止します</li>
              <li>違法・有害なコンテンツの入力を禁止します</li>
              <li>本サービスの診断結果を商業目的で無断転用することを禁止します</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第3条（データの取り扱い）</h3>
            <p>入力された文章および診断結果は、サービス改善を目的としてサーバーに一定期間保存される場合があります。個人を特定できる形での第三者への提供は行いません。保存データは最大90日間保持され、その後自動的に削除されます。</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第4条（AIの性質について）</h3>
            <p>本サービスの診断はAI（Claude）によって行われます。診断結果は参考情報であり、正確性・完全性を保証するものではありません。最終的な文章の判断はユーザー自身が行ってください。</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第5条（免責事項）</h3>
            <p>当社は、本サービスの利用によって生じた損害について、一切の責任を負いません。サービスは予告なく変更・停止される場合があります。</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第6条（お問い合わせ）</h3>
            <p>本規約に関するお問い合わせは、合同会社リベルダードまでご連絡ください。</p>
          </section>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
