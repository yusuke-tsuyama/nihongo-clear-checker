import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSessionId } from "./session";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

export async function saveDiagnosis(data: {
  input_text: string;
  score: number;
  summary: string;
  result_json: string;
}) {
  const client = getSupabase();
  if (!client) return;
  const sessionId = getSessionId();
  return client.from("diagnoses").insert({ ...data, session_id: sessionId });
}

export async function fetchDiagnoses(): Promise<{ data: DiagnosisRecord[] | null; error: Error | null }> {
  const sessionId = getSessionId();
  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) return { data: null, error: new Error("Failed to fetch history") };
    const json = await res.json();
    return { data: json.data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface DiagnosisRecord {
  id?: string;
  created_at?: string;
  input_text: string;
  score: number;
  summary: string;
  result_json: string;
  session_id?: string;
}
