import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

// Convenience proxy — safe to import anywhere
export const supabase = {
  from: (table: string) => {
    const client = getSupabase();
    if (!client) {
      // Return a no-op object when Supabase is not configured
      return {
        insert: async () => ({ error: null }),
        select: (_cols?: string) => ({
          order: () => ({ limit: async () => ({ data: [], error: null }) }),
        }),
      };
    }
    return client.from(table);
  },
};

export interface DiagnosisRecord {
  id?: string;
  created_at?: string;
  input_text: string;
  score: number;
  summary: string;
  result_json: string; // full JSON stringified
}
