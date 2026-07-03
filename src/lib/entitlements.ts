/**
 * ポイント値・ランク・エンタイトルメント定義。
 *
 * POINT_VALUES は supabase/migrations/20260703_0003_points_and_examples.sql の
 * RPC 関数（add_helpful_vote / create_public_example）内で定義された
 * PL/pgSQL 定数（c_points_helpful_vote / c_points_public_example）と
 * 値を一致させること。どちらかを変更した場合は必ずもう一方も同期すること。
 */
export const POINT_VALUES = {
  PUBLIC_REWRITE_EXAMPLE_CREATED: 10,
  HELPFUL_RECEIVED: 3,
} as const;

export interface Entitlements {
  maxCharacters: number;
  // 将来的に betaLongTextMode など新しい entitlement を追加する場合は
  // ここにプロパティを足すだけで RANKS 側に反映できる。
}

export interface Rank {
  name: string;
  minPoints: number;
  entitlements: Entitlements;
}

export const RANKS: Rank[] = [
  { name: "Beginner", minPoints: 0, entitlements: { maxCharacters: 3000 } },
  { name: "Bronze", minPoints: 100, entitlements: { maxCharacters: 5000 } },
  // 将来追加予定: Silver / Gold / Platinum など
];

export const DEFAULT_ENTITLEMENTS: Entitlements = { maxCharacters: 3000 };

function normalizePoints(totalPoints: number | null | undefined): number {
  if (typeof totalPoints !== "number" || !Number.isFinite(totalPoints) || totalPoints < 0) {
    return 0;
  }
  return totalPoints;
}

/**
 * totalPoints に対して該当する最上位ランクを返す（降順探索）。
 *
 * 境界値の挙動（重要）:
 * - totalPoints = 0   -> Beginner（maxCharacters: 3000）
 * - totalPoints = 99  -> Beginner（maxCharacters: 3000）※Bronzeの閾値100に未到達
 * - totalPoints = 100 -> Bronze（maxCharacters: 5000）  ※閾値ちょうどで昇格
 * - totalPoints = 101 -> Bronze（maxCharacters: 5000）
 * - 負数 / undefined / null -> Beginner 扱い（0として正規化）
 */
export function getRank(totalPoints: number | null | undefined): Rank {
  const points = normalizePoints(totalPoints);
  const sortedDesc = [...RANKS].sort((a, b) => b.minPoints - a.minPoints);
  const matched = sortedDesc.find((rank) => points >= rank.minPoints);
  return matched ?? RANKS[0];
}

export function getEntitlements(totalPoints: number | null | undefined): Entitlements {
  return getRank(totalPoints).entitlements;
}
