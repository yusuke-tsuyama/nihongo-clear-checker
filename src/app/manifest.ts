import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "日本語クリアチェッカー",
    short_name: "クリアチェッカー",
    description:
      "文章の係り受け、読点、主語と述語の距離、重複表現、あいまいな指示語をチェックし、読みやすい文章に整えます。",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a56db",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
