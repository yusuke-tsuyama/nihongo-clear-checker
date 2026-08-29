"use client";
import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
  initialTab?: "terms" | "privacy";
}

export default function TermsModal({ onClose, initialTab = "terms" }: Props) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);

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
            {activeTab === "terms" ? "利用規約" : "プライバシーポリシー"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lg"
            style={{ background: "var(--paper)", color: "var(--ink-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid var(--border)", background: "var(--paper)" }}>
          {(["terms", "privacy"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-medium transition-colors"
              style={{
                borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === tab ? "var(--accent)" : "var(--ink-muted)",
                background: "transparent",
              }}
            >
              {tab === "terms" ? "利用規約" : "プライバシーポリシー"}
            </button>
          ))}
        </div>

        {/* Body */}
        {activeTab === "terms" ? (
          <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm" style={{ color: "var(--ink-soft)", lineHeight: 1.9 }}>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>最終更新日：2026年8月28日</p>

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
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第3条（アカウントとログイン）</h3>
              <p>本サービスの一部機能（クリアポイント、文字数上限の拡張、リライト事例の公開等）をご利用いただくには、メールアドレスによるログインが必要です。ユーザーは、登録したメールアドレスの管理について自らの責任を負うものとします。当社は、不正利用が疑われる場合、アカウントの利用を制限することがあります。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第4条（データの取り扱い）</h3>
              <p className="mb-2">入力された文章は、AIによる診断・リライト処理のため、Anthropic社が提供するClaude APIに送信されます。当社データベースへの保存は、ユーザーの操作に応じて以下のとおり異なります。</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>① 診断・リライトのみを行った場合</p>
                  <p>入力文章および結果は、当社データベースには保存されません。</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>② 「履歴に保存する」を選択した場合</p>
                  <p>入力文章、診断結果、およびリライト案が、当社データベースに保存されます。保存された履歴は、ユーザーご自身の操作により確認・削除できます。</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>③ 「公開リライト事例」として投稿した場合</p>
                  <p>投稿された元文章、リライト文、タイトル等が当社データベースに保存され、他の利用者に公開されます。公開した事例は、ユーザーご自身の操作によりいつでも削除できます。</p>
                </div>
              </div>
              <p className="mt-2">保存されたデータは、ユーザーによる削除、またはサービスの運営上必要と当社が判断した場合に削除されることがあります。当社は、保存データを本サービスの提供および品質改善の目的で利用します。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第5条（クリアポイントおよびランクについて）</h3>
              <p>クリアポイントは、本サービスへの貢献度に応じて付与される、サービス内でのみ意味を持つ実績指標です。現金・電子マネー等の金銭的価値を有するものではなく、換金・譲渡・移転することはできません。ポイントの付与条件、ランクの基準、ポイントによって利用可能となる機能は、予告なく変更される場合があります。当社が不正な手段によるポイント取得と判断した場合、ポイントの取消しやアカウントの利用制限を行うことがあります。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第6条（公開リライト事例について）</h3>
              <p>ユーザーは、診断・リライトの結果を「公開リライト事例」として投稿し、公開することができます（ユーザーが明示的に選択した場合に限ります）。公開にあたっては、氏名・住所・連絡先・企業名・顧客名・契約情報等の個人情報・機密情報を含めないでください。公開した内容についての責任はユーザーご自身に帰属します。投稿されたコンテンツの著作権はユーザーに帰属しますが、ユーザーは当社が本サービスの提供・改善のために当該コンテンツを利用（表示等）することを許諾するものとします。公開した事例は、ユーザーがいつでも削除できます。当社は、個人情報・機密情報を含むもの、第三者の権利を侵害するもの、違法または公序良俗に反するもの、その他運営上不適切と判断したものについて、事前の通知なく非公開化または削除することがあります。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第7条（AIの性質と利用範囲）</h3>
              <p className="mb-2">本サービスの診断はAI（Claude）によって行われます。以下の点をご理解のうえご利用ください。</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>診断結果は参考情報であり、正確性・完全性を保証するものではありません</li>
                <li>AIの判断には誤りや偏りが含まれる場合があります</li>
                <li>医療・法律・金融に関する専門的判断の代替としてご利用いただくことはできません</li>
                <li>最終的な文章の判断はユーザー自身が行ってください</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第8条（免責事項）</h3>
              <p className="mb-2">当社は、本サービスの利用によって生じた損害について、責任を負いかねます。サービスは予告なく変更・停止される場合があります。</p>
              <p>医療・法律・金融・その他専門的な判断が必要な事項については、必ず該当分野の専門家にご相談ください。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第9条（お問い合わせ）</h3>
              <p>本規約に関するお問い合わせは、合同会社リベルダードまでご連絡ください。<br />メール：info@liberdade.sakura.ne.jp</p>
            </section>
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm" style={{ color: "var(--ink-soft)", lineHeight: 1.9 }}>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>最終更新日：2026年8月28日</p>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第1条（取得する情報）</h3>
              <p>本サービスでは、以下の情報を取得します。</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>入力文章・診断結果データ</li>
                <li>ログイン時のメールアドレス（認証のため）</li>
                <li>ユーザーが公開を選択したリライト事例（元文章・リライト後の文章・タイトル等）</li>
                <li>クリアポイント・ランク等の利用実績</li>
                <li>AI処理に関する記録（処理時間・入力文字数・利用モデル等の技術情報）</li>
                <li>サービス利用状況に関する匿名の統計情報</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第2条（利用目的）</h3>
              <p>取得した情報は、以下の目的で利用します。</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>文章の診断・リライト機能の提供</li>
                <li>アカウント認証およびログイン状態の維持</li>
                <li>クリアポイント・ランク機能の提供</li>
                <li>公開リライト事例の掲載</li>
                <li>サービスの品質改善および不具合分析</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第3条（保存・非保存・Cookieについて）</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>保存する情報：</p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>「履歴に保存する」を選択した場合、入力文章・診断結果・リライト案を保存します。</li>
                    <li>「公開リライト事例」として投稿した場合、その元文章・リライト文・タイトル等を保存し、他の利用者に公開します。</li>
                    <li>ログイン中は、メールアドレスおよびクリアポイント等のアカウント情報を保存します。</li>
                  </ul>
                  <p className="mt-1">これらのデータは、ユーザーによる削除操作により削除できます。当社が保存期間をあらかじめ限定して自動削除する仕組みは、現時点では設けていません。</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>保存しない情報：</p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>診断・リライトのみを行い、保存操作をしなかった場合の入力文章</li>
                    <li>パスワード、決済情報等の機密情報</li>
                  </ul>
                </div>
                <p><span className="font-medium" style={{ color: "var(--ink)" }}>Cookie等：</span>本サービスでは、オンボーディング完了状態の管理およびログインセッションの維持のため、Cookieおよびブラウザのローカルストレージを使用します。第三者トラッキングCookieは使用しません。</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第4条（外部サービスへの送信・委託）</h3>
              <p>入力文章は、診断・リライトのためAnthropic社（米国）が提供するClaude APIに送信されます。送信データはAnthropic社のプライバシーポリシーに従って処理されます。アカウント情報、公開リライト事例、診断結果等のデータの保存には、Supabaseを利用しています。ログイン用のメール送信には、メール配信基盤を利用しています。いずれの送信・保存も、暗号化通信（HTTPS）により行われます。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第5条（公開リライト事例について）</h3>
              <p>リライト事例の公開は、ユーザーが明示的に選択した場合にのみ行われ、デフォルトでは非公開です。公開された事例は、他の利用者が閲覧できる状態になります。ユーザーは、公開した事例をいつでも削除することができます。公開にあたっては、個人情報・機密情報を含めないよう十分ご注意ください。公開内容についての責任はユーザーご自身に帰属します。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第6条（第三者への提供）</h3>
              <p>当社は、以下の場合を除き、取得した情報を第三者に提供しません。</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>サービス運営に必要な業務委託先への提供（守秘義務契約を締結した場合）</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第7条（個人情報入力についての注意）</h3>
              <p>診断・リライトを行う文章の中に、氏名・住所・電話番号・マイナンバーなどの個人情報を含めないようご注意ください。万が一、個人情報が含まれる文章を入力された場合でも、当社は当該情報の管理について責任を負いかねます。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第8条（ポリシーの変更）</h3>
              <p>本プライバシーポリシーは、法令の改正やサービスの変更に伴い、予告なく変更される場合があります。変更後のポリシーはサービス上に掲載した時点で効力を生じます。定期的にご確認いただくことをお勧めします。</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>第9条（お問い合わせ）</h3>
              <p>プライバシーポリシーに関するお問い合わせは、合同会社リベルダードまでご連絡ください。<br />メール：info@liberdade.sakura.ne.jp</p>
            </section>
          </div>
        )}

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
