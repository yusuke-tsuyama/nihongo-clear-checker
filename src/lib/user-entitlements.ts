import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ENTITLEMENTS, getEntitlements, type Entitlements } from "./entitlements";

/**
 * サーバー専用。ログイン状態と profiles.total_points から entitlements を解決する。
 *
 * 未ログイン・profiles行なし・エラー時はすべて DEFAULT_ENTITLEMENTS に
 * フォールバックする（診断機能を止めないため、ここでは throw しない）。
 */
export async function getUserEntitlements(
  supabaseServerClient: SupabaseClient
): Promise<Entitlements> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseServerClient.auth.getUser();

    if (userError || !user) {
      return DEFAULT_ENTITLEMENTS;
    }

    const { data: profile, error: profileError } = await supabaseServerClient
      .from("profiles")
      .select("total_points")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return DEFAULT_ENTITLEMENTS;
    }

    return getEntitlements(profile.total_points as number | null | undefined);
  } catch {
    return DEFAULT_ENTITLEMENTS;
  }
}
