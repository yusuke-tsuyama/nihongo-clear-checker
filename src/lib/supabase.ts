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

export async function fetchDiagnoses() {
  const client = getSupabase();
  if (!client) return { data: [], error: null };
  const sessionId = getSessionId();
  return client
    .from("diagnoses")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20);
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
