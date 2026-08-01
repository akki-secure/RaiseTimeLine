# ドキュメント一覧

X(Twitter)風タイムラインSNSアプリの設計ドキュメント。学習目的で作成。

## 読む順序

1. [requirements.md](./requirements.md) — 全体要件定義書（目的・概要・非機能要件・技術スタック・ER図/画面遷移図の概要など）
2. [features.md](./features.md) — 機能一覧（各機能の詳細ドキュメントへのインデックス）
3. `features/` — 機能ごとの個別要件定義書
   - [01_login.md](./features/01_login.md) — ログイン機能
   - [02_timeline.md](./features/02_timeline.md) — タイムライン機能
   - [03_comment.md](./features/03_comment.md) — コメント機能
   - [04_like.md](./features/04_like.md) — いいね機能
   - [05_image_post.md](./features/05_image_post.md) — 画像投稿機能
   - [06_follow.md](./features/06_follow.md) — フォロー・フォロワー機能
   - [07_user_search.md](./features/07_user_search.md) — ユーザー検索機能
4. [screens.md](./screens.md) — 画面設計（画面一覧・画面遷移図・簡易ワイヤーフレーム）
5. [er.md](./er.md) — ER図・テーブル定義
6. [aws.md](./aws.md) — AWSインフラ構成（想定案、未確定部分あり）
7. [logging-operations.md](./logging-operations.md) — ログ運用・監視設計（構造化ログのフォーマット、保存・保持方針、監視の考え方）
8. [testing.md](./testing.md) — テスト方針（なぜテストを書くのか、レイヤーごとのテスト方針、スコープ外）

## 技術スタック概要

隣接プロジェクト TaskManagement と同一バージョンで統一。

- フロントエンド: React 19 + Vite 8 + React Router 7
- バックエンド: Spring Boot 3.4.5 + Java 21
- データベース: PostgreSQL 16
- 認証: JWT + BCrypt
- 画像ストレージ: AWS S3

詳細は[requirements.md](./requirements.md#技術スタック)を参照。
