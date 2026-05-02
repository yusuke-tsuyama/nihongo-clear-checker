import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは日本語文章の専門家です。ユーザーが入力した日本語文を診断し、必ずJSONのみで返答してください。コードブロックや説明文は含めないでください。

【リライトの絶対ルール】
- リライトは元の文章と必ず同程度の長さ・ボリュームにすること
- 元の全段落・全見出し・全論点を漏らさず含めること
- 省略・圧縮・要約を禁止する

返すJSON形式：
{"score":数値(0-100),"summary":"全体評価コメント","checks":[{"name":"係り受けの分かりやすさ","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"主語と述語の距離","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"読点の位置","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"一文の長さ","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"指示語の明確さ","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"重複表現","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"文の順序","status":"OK","issue":"指摘内容","reason":"理由","example":"例"},{"name":"読みやすさ","status":"OK","issue":"指摘内容","reason":"理由","example":"例"}],"rewrites":{"simple":"読みやすい版（完全版・省略禁止）","web":"Web記事向け版（完全版・省略禁止）","business":"ビジネス文書版（完全版・省略禁止）"}}`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "テキストが入力されていません。" }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "文字数が多すぎます（3000字以内でお願いします）。" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `以下の文章（${text.length}字）を診断してください。リライト案は元と同じボリュームで全段落・全見出しを含めて出力してください：\n\n${text}` }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // JSON修復：末尾が途中で切れた場合に閉じる
    let jsonStr = cleaned;
    try {
      JSON.parse(jsonStr);
    } catch {
      // 末尾に }}} を補完して再試行
      for (const suffix of ['"}}}', '"}}', '"}', '}}}', '}}', '}']) {
        try {
          JSON.parse(jsonStr + suffix);
          jsonStr = jsonStr + suffix;
          break;
        } catch { continue; }
      }
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "診断結果の解析に失敗しました。文章を短くして再度お試しください。" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
    return NextResponse.json({ error: `エラーが発生しました: ${message}` }, { status: 500 });
  }
}
