import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "日本語クリアチェッカー",
  description: "文章の係り受け、読点、主語と述語の距離、重複表現、あいまいな指示語をチェックし、読みやすい文章に整えます。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
