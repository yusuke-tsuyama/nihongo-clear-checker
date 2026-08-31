import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ENTITLEMENTS, getEntitlements, getRank, type Entitlements } from "./entitlements";

export interface UserEntitlements extends Entitlements {
  rank: string;
  totalPoints: number;
  isLoggedIn: boolean;
  displayName: string | null;
}

const GUEST_ENTITLEMENTS: UserEntitlements = {
  ...DEFAULT_ENTITLEMENTS,
  rank: "Guest",
  totalPoints: 0,
  isLoggedIn: false,
  displayName: null,
};

/**
 * サーバー専用。ログイン状態と profiles.total_points から entitlements を解決する。
 *
 * 未ログイン・profiles行なし・エラー時はすべて GUEST_ENTITLEMENTS に
 * フォールバックする（診断機能を止めないため、ここでは throw しない）。
 */
export async function getUserEntitlements(
  supabaseServerClient: SupabaseClient
): Promise<UserEntitlements> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseServerClient.auth.getUser();

    if (userError || !user) {
      return GUEST_ENTITLEMENTS;
    }

    const { data: profile, error: profileError } = await supabaseServerClient
      .from("profiles")
      .select("total_points, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return GUEST_ENTITLEMENTS;
    }

    const totalPoints = (profile.total_points as number | null | undefined) ?? 0;
    const displayName = (profile.display_name as string | null | undefined) ?? null;

    return {
      ...getEntitlements(totalPoints),
      rank: getRank(totalPoints).name,
      totalPoints,
      isLoggedIn: true,
      displayName,
    };
  } catch {
    return GUEST_ENTITLEMENTS;
  }
}
