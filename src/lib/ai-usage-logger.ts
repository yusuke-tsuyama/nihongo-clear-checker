import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AiUsageLogEntry {
  user_id: string | null;
  request_id: string;
  mode: "diagnosis" | "rewrite";
  rewrite_pattern: "simple" | "web" | "business" | null;
  input_chars: number;
  output_chars: number;
  input_tokens: number | null;
  output_tokens: number | null;
  model: string;
  max_tokens: number;
  duration_ms: number;
  success: boolean;
  error_message: string | null;
}

// ai_usage_logsへの書き込み。失敗しても本処理を止めないよう、呼び出し側でthrowしない。
export async function logAiUsage(entry: AiUsageLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from("ai_usage_logs").insert(entry);
    if (error) {
      console.error("AI利用ログ書き込みエラー:", error);
    }
  } catch (err) {
    console.error("AI利用ログ書き込み失敗:", err);
  }
}
