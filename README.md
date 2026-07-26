# RaiseTimeLine

X(Twitter)風のタイムライン型SNSアプリです。学習目的で個人開発していますが、複数ユーザーが同時に使うことを前提に設計しています。

ログインしたユーザーは短文投稿（画像添付可）ができ、他ユーザーの投稿にコメント・いいねができます。ユーザー同士はフォロー・フォロワーの関係を持ち、ユーザー検索で他のユーザーを見つけられます。いいね・コメントは投稿者本人だけでなく第三者からの操作も想定しており、いいね数・コメント数・フォロー数・フォロワー数を正しく集計して表示します。

> **現在の状況**: 要件定義・機能定義・画面設計・ER設計・インフラ構成の設計フェーズが完了した段階です。`backend` / `frontend` の実装はこれから着手します。

## 機能

- ログイン機能（メールアドレス＋パスワード、JWT認証）
- タイムライン機能（全ユーザーの投稿を新着順に表示、投稿・削除）
- コメント機能（投稿者本人・第三者を問わずコメント可能、コメント数表示）
- いいね機能（投稿者本人・第三者を問わずいいね可能、いいね数表示、二重いいね防止）
- 画像投稿機能（投稿への画像添付、AWS S3に保存）
- フォロー・フォロワー機能（フォロー／フォロー解除、フォロー数・フォロワー数表示）
- ユーザー検索機能（ユーザー名・表示名によるあいまい検索）

各機能の詳細仕様は [docs/features.md](docs/features.md) と [docs/features/](docs/features/) 配下の個別要件定義書を参照してください。

## 技術スタック

TaskManagementプロジェクトと同一バージョンで統一しています。

| 役割 | 技術 |
|---|---|
| フロントエンド | React 19 + Vite 8 + React Router 7 |
| バックエンド | Spring Boot 3.4.5 + Java 21 |
| データベース | PostgreSQL 16 |
| DBアクセス | MyBatis（mybatis-spring-boot-starter 3.0.3） |
| 認証 | JWT（jjwt 0.12.6）+ BCrypt |
| 画像ストレージ | AWS S3 |
| ローカル開発環境 | Docker / docker-compose |
| 本番インフラ（想定・未確定） | AWS EC2 / RDS / ALB |

## ドキュメント

設計ドキュメント一式は [docs/](docs/) 配下にまとまっています。読む順序や各ドキュメントの概要は [docs/README.md](docs/README.md) を参照してください。

| ドキュメント | 内容 |
|---|---|
| [docs/requirements.md](docs/requirements.md) | 全体要件定義書 |
| [docs/features.md](docs/features.md) | 機能一覧 |
| [docs/features/](docs/features/) | 機能別要件定義書（7機能） |
| [docs/screens.md](docs/screens.md) | 画面設計（画面一覧・画面遷移図・簡易ワイヤーフレーム） |
| [docs/er.md](docs/er.md) | ER図・テーブル定義 |
| [docs/aws.md](docs/aws.md) | AWSインフラ構成（想定案） |

## 必要な環境（実装後）

- Node.js 18以上
- Java 21以上
- Docker（PostgreSQL コンテナ起動用）

## 起動方法（実装後に利用可能）

### 一括起動（Claude Code スキル）

Claude Code を使っている場合は、以下のスキルコマンド一つで DB・バックエンド・フロントエンドをすべて起動できます。

```
/start
```

各サービスの起動確認まで自動で行います。詳細は [.claude/skills/start/SKILL.md](.claude/skills/start/SKILL.md) を参照してください。

### 手動起動

#### 1. データベース（PostgreSQL）

```bash
docker compose up -d
docker compose ps   # State: running を確認
```

#### 2. バックエンド（Spring Boot） — ポート 8080

```bash
cd backend
./gradlew bootRun
```

起動確認:
```
http://localhost:8080/api/posts
```

#### 3. フロントエンド（React + Vite） — ポート 5173

```bash
cd frontend
npm install   # 初回のみ
npm run dev
```

ブラウザで開く:
```
http://localhost:5173
```

> バックエンドの接続設定は `backend/src/main/resources/application.properties` で変更する想定です。

## テスト用ユーザー

機能追加時の動作確認で、新規登録ユーザーだけでなく既存ユーザーでもログインして確認できるよう、直近の動作確認で作成したユーザーを記録しています。

| ユーザー名 | メールアドレス | 表示名 | パスワード |
|---|---|---|---|
| mybatis_test | mybatis_test@example.com | MyBatisテスト | TestPass1234 |

## Claude Code スキル

このプロジェクトには Claude Code 用のカスタムスキルが含まれています。

| スキル | コマンド | 説明 |
|---|---|---|
| 一括起動 | `/start` | DB・バックエンド・フロントエンドをすべて起動し、起動確認まで行う |

スキルのソースは [.claude/skills/](.claude/skills/) に格納されています。

## ブランチ運用

`main` ブランチへの直接pushは禁止し、Pull Requestを経由してマージします。マージ後のブランチは自動削除されます。
