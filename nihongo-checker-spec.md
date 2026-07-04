# 日本語クリアチェッカー 仕様書

最終更新: 2026-07-04（コードベースの現状を反映）

## 1. アプリ概要・技術スタック

日本語の文章を診断し、3パターンでリライトするWebアプリ。運営: 合同会社リベルダード。

- フレームワーク: Next.js 14.2.5（App Router）/ React 18 / TypeScript 5
- スタイル: Tailwind CSS 3.4
- 認証・DB: Supabase（`@supabase/supabase-js` 2.110, `@supabase/ssr` 0.12）
  - ブラウザ用クライアント: `src/lib/supabase/client.ts`（シングルトン）
  - サーバー用クライアント: `src/lib/supabase/server.ts`（Cookie経由でセッション同期）
  - `middleware.ts` が全リクエストで `updateSession()` を呼び、Supabaseセッションcookieを更新（静的アセットは対象外）
- AI: Anthropic API（`@anthropic-ai/sdk` 0.24.3）。使用モデルは `src/lib/constants.ts` の `CLAUDE_MODEL = "claude-sonnet-4-6"` で一元管理
- デプロイ: Vercel（`.gitignore` に `.vercel` の除外設定があり、Vercel CLI運用を前提としていることが確認できる。`vercel.json` によるカスタム設定は無し）
- 環境変数: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY`（`.env.local.example` に記載があるのは `ANTHROPIC_API_KEY` のみ）

## 2. 機能一覧

### 2.1 文章診断
- `/`（`src/app/page.tsx`）のテキストエリアに文章を貼り付け「文章を診断する」を実行
- 6基準（係り受け・読点・「の」連打/名詞化構文・受動態と語の選択・体言止め・段落構成）でstatus（OK/注意/要修正）とコメントを返す
- スコアは `score = (OKの数×20 + 注意の数×10 + 要修正の数×0)` を基準に、体言止め・段落構成は問題がある場合のみ加味した配点で算出
- 診断→リライトの2段階リクエスト構成（診断結果を先に表示し、続けてリライトを生成）

### 2.2 リライト（3パターン）
- simple（読みやすい版）/ web（Web記事向け）/ business（ビジネス文書）の3パターンを並行生成（`mapWithConcurrency` で最大3並列）
- 各パターンともmax_tokens到達時は共通の「文章が長いため結果が途中で切れました。文章を分割してお試しください。」を表示

### 2.3 履歴
- ログイン不要。`localStorage` に保存したセッションID（`crypto.randomUUID()`）単位で管理（`src/lib/session.ts`）
- 診断完了時に自動保存、または「履歴に保存する」ボタンで手動保存
- 履歴パネルは直近20件を表示（`/api/history`）

### 2.4 認証
- Supabase Authのマジックリンク（メールOTP）のみ。`/login` でメール送信 → `/auth/callback` でコード交換 → セッション確立
- ヘッダーの `AuthStatus` コンポーネントでログイン中メールアドレス表示・ログアウトが可能

### 2.5 ポイント・ランク制
- ランクに応じて診断可能な最大文字数（entitlement）が変わる（詳細は4章）
- ポイントは「公開事例の投稿」「投稿への参考になった投票の獲得」で加算

### 2.6 公開事例（投稿・一覧・投票・削除）
- リライト結果を「公開事例」として投稿可能（ログイン必須）。投稿前に個人情報除去の確認チェックボックスが必須
- `/examples` で公開事例一覧（最大50件、新着順）を閲覧。各事例に投票数を表示
- ログインユーザーは他人の投稿に「参考になった」投票が可能（自分の投稿・二重投票は不可）
- 投稿者は自分の投稿を削除可能（論理削除）

## 3. API一覧

| エンドポイント | メソッド | 認証 | 概要 |
|---|---|---|---|
| `/api/analyze-writing` | POST | 任意（未ログイン可） | 診断・リライト実行 |
| `/api/history` | POST | 不要（session_idで絞込） | 診断履歴を直近20件取得 |
| `/api/me/entitlements` | GET | 任意 | ログインユーザーのentitlements（maxCharacters）取得 |
| `/api/examples` | GET | 不要 | 公開事例一覧取得（最大50件） |
| `/api/examples` | POST | 必須 | 公開事例を投稿（+10pt） |
| `/api/examples?id=` | DELETE | 必須 | 自分の投稿を論理削除 |
| `/api/votes` | POST | 必須 | 事例に「参考になった」投票（投稿者に+3pt） |
| `/auth/callback` | GET | - | マジックリンクのコードをセッションに交換しリダイレクト |

### 3.1 `/api/analyze-writing`（POST）
- body: `{ text, sessionId?, mode?: "diagnosis" | "rewrite" | undefined, diagnosisResult? }`
- 呼び出し前に `getUserEntitlements()` でmaxCharactersを取得し、`text.length` が上限超過なら `400 { error: "INPUT_TOO_LONG", maxCharacters, inputChars }`
- `mode: "diagnosis"`: 診断のみ実行し `{ score, overall, criteria }` を返す
- `mode: "rewrite"`: `diagnosisResult` を必須とし、診断をスキップして `{ rewrites: { simple, web, business } }` のみ返す
- `mode` 未指定（後方互換）: 診断＋リライトを両方実行し、`sessionId` があれば `diagnoses` テーブルへ保存
- レート制限: IPアドレス単位で30回/日（`rate_limits`テーブル）。**診断系リクエスト（diagnosisモード・後方互換モード）のみに適用され、`mode: "rewrite"` 単体の呼び出しには適用されない**
- 診断JSONのparse失敗時・リライト失敗時は `500`、診断応答がmax_tokens到達時は `422 { error: "OUTPUT_TRUNCATED" }`

### 3.2 `/api/history`（POST）
- body: `{ sessionId }`
- `diagnoses` テーブルから `session_id` 一致行を `created_at` 降順で20件取得し `{ data }` を返す
- Service Roleキーで実行（RLSを経由せず、クライアントが送ってきた `sessionId` のみで絞り込む設計）

### 3.3 `/api/me/entitlements`（GET）
- ログイン中なら `profiles.total_points` からランクを判定、未ログイン・エラー時は `DEFAULT_ENTITLEMENTS`（3000字）を返す

### 3.4 `/api/examples`（GET/POST/DELETE）
- GET: `is_public = true` かつ `deleted_at is null` の投稿を新着順で最大50件取得。RPC `get_public_vote_counts` で投票数を付与し、ログイン中なら自分の投票済みID一覧 `myVotedExampleIds` も返す
- POST: 未ログインは `401`。`title`（1〜100字）・`original`（1〜5000字）・`rewritten`（1〜5000字）・`pattern`（simple/web/business）をバリデーションし、途中切れメッセージを含む投稿は拒否。RPC `create_public_example` を実行
- DELETE: 未ログインは `401`。`deleted_at` を現在時刻で更新する論理削除。本人判定はRLS（`rewrite_examples_update_own`）に委譲

### 3.5 `/api/votes`（POST）
- body: `{ example_id }`。未ログインは `401`
- RPC `add_helpful_vote` を実行。自分の投稿・二重投票時は `409`、対象が存在しない場合は `404`

## 4. DB構成

### 4.1 テーブル一覧（`supabase/migrations/`）
| テーブル | 用途 | RLS方針の要点 |
|---|---|---|
| `profiles` | ユーザーごとの累計ポイント（`total_points`） | SELECTは本人のみ。INSERT/UPDATE/DELETEポリシーなし（`handle_new_user()`関数経由のみを想定） |
| `point_events` | ポイント付与履歴（監査ログ） | SELECTは本人のみ。書き込みポリシーなし（SECURITY DEFINER RPC経由のみ） |
| `rewrite_examples` | 公開リライト事例 | SELECTは「公開かつ未削除」または本人。INSERT/UPDATE/DELETEは本人のみ |
| `helpful_votes` | 「参考になった」投票（`example_id, voter_id`にunique制約） | SELECTは認証済み全員。書き込みポリシーなし（RPC経由のみ） |
| `ai_usage_logs` | AI呼び出しログ用に定義 | クライアント向けポリシーなし（サーバー/Service Role専用） |

### 4.2 主要RPC
- `handle_new_user()`: `auth.users` 新規作成時に `profiles` へ行を作成するトリガー関数。**ただしmigrationファイル内には `CREATE TRIGGER` 文が無く、`auth.users` へのトリガー紐付けはSupabaseダッシュボード側で手動設定されたと推測される**
- `add_helpful_vote(p_example_id)`: 投票を登録し、投稿者に+3pt（`c_points_helpful_vote`）を付与。自分の投稿への投票・重複投票は例外を投げる
- `create_public_example(p_title, p_original, p_rewritten, p_pattern)`: 公開事例を作成し、投稿者に+10pt（`c_points_public_example`）を付与
- `get_public_vote_counts(p_example_ids[])`: `voter_id`等の個人情報を含まない投票数集計のみを返す。`anon`・`authenticated`双方に実行権限を付与

### 4.3 未解決・要注意事項（詳細は6章）
- `diagnoses`・`rate_limits` の2テーブルはコード内で参照されているが、`supabase/migrations/` 配下のいずれのファイルにも定義が存在しない（Supabaseダッシュボードで直接作成されたものと推測される）

## 5. ランク・entitlement仕様（`src/lib/entitlements.ts`）

| ランク | 必要ポイント（累計） | 上限文字数 |
|---|---|---|
| Beginner | 0pt | 3,000字 |
| Bronze | 100pt | 5,000字 |

- `getRank(totalPoints)`: 降順に閾値を探索し該当ランクを返す。`null`/`undefined`/負数はすべて0点（Beginner）として正規化
- `getUserEntitlements()`（`src/lib/user-entitlements.ts`, サーバー専用）: 未ログイン・`profiles`行なし・エラー時は例外を投げず `DEFAULT_ENTITLEMENTS`（3000字）にフォールバック
- 文字数上限は `/api/analyze-writing` でAI呼び出し前にチェックされ、`diagnosis`・`rewrite`・後方互換モードいずれにも適用される
- ポイント値（`POINT_VALUES`）: `PUBLIC_REWRITE_EXAMPLE_CREATED = 10` / `HELPFUL_RECEIVED = 3`
  - この値はTypeScript側（`entitlements.ts`）とSQL側（RPC内のPL/pgSQL定数）の**二重管理**であり、コード内コメントで「どちらかを変更した場合は必ずもう一方も同期すること」と明記されている
- Silver/Gold/Platinum等の追加ランクはコード内コメントで「将来追加予定」とされているのみで未実装

## 6. 既知の制約・今後の予定

- 公開事例一覧（`GET /api/examples` / `/examples`）は50件固定で返す。ページネーションはPhase 7で対応する（`src/app/api/examples/route.ts` 内のコメントもPhase 7に統一済み）
- `diagnoses` テーブルへの書き込みが2種類の異なるカラムセットで行われている
  - `/api/analyze-writing`（後方互換モード時の自動保存）: `session_id, original_text, score, checks, rewrites, created_at`
  - `src/lib/supabase.ts` の `saveDiagnosis()`（`page.tsx` からの手動/自動保存）: `session_id, input_text, score, summary, result_json`
  - `/api/history` のSELECTは後者のカラム名（`input_text`/`summary`/`result_json`）を前提としているため、前者の書き込みが履歴表示に正しく反映されない可能性がある
- `ai_usage_logs` テーブルは定義済みだが、現状どのコードからも書き込みが行われておらず未使用
- `diagnoses`・`rate_limits` はmigrationファイルに存在せず、スキーマ管理が仕様書・migration外で行われている（4.3参照）
- レート制限は30回/日/IPで、`mode: "rewrite"` 単体呼び出しには適用されない（診断を伴うリクエストのみ対象）
- ポイント値のTypeScript/SQL二重管理は手動同期が必要（5章参照）
