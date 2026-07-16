---
description: RaiseTimeLineプロジェクトのDB・バックエンド・フロントエンドをすべて起動する
---

以下の手順でRaiseTimeLineプロジェクトのサーバーをすべて起動してください。各ステップを順番に実行し、起動を確認してから次へ進んでください。

> **現在の実装範囲**: ユーザー登録・ログイン（認証・認可）のみ実装済み。ログイン後の画面は本実装のタイムラインではなく "Hello World!" の仮画面です。

## Step 1: データベース（PostgreSQL）を起動

プロジェクトルート（/Users/aki/Desktop/RaiseTimeLine）で以下を実行してください:

```bash
docker compose up -d --wait
```

`--wait` によりヘルスチェックが通るまで待機するため、完了後は即座に次のステップへ進んでください。

## Step 2: バックエンド（Spring Boot）を起動

**注意:** システムデフォルトのJavaでビルドできない場合があるため、Java 21を明示指定する。パスが異なる場合は `$(/usr/libexec/java_home -v 21)` で確認すること。

以下のコマンドをバックグラウンドで実行してください:

```bash
cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew bootRun > /tmp/backend.log 2>&1 &
```

起動完了まで待機してください:

```bash
until grep -q "Started RaiseTimeLineApplication" /tmp/backend.log 2>/dev/null; do sleep 2; done && echo "Backend ready"
```

ポートは **8080** です。API疎通確認は以下で行えます（ログイン成功時は200、失敗時は400が返ればOK）:

```bash
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"dummy1234"}'
```

## Step 3: フロントエンド（React + Vite）を起動

以下のコマンドをバックグラウンドで実行してください:

```bash
cd frontend && npm run dev > /tmp/frontend.log 2>&1 &
```

ログを確認し、`Local: http://localhost:5173` が出力されたら起動完了です:

```bash
until grep -q "Local:" /tmp/frontend.log 2>/dev/null; do sleep 1; done && echo "Frontend ready"
```

## 完了報告

全サービスが起動したら、以下の情報をユーザーに報告してください:

| サービス | URL | 状態 |
|---|---|---|
| フロントエンド（ログイン後は"Hello World!"仮画面） | http://localhost:5173 | ✅ 起動済み |
| バックエンドAPI | http://localhost:8080/api/auth/login | ✅ 起動済み |
| DB（PostgreSQL） | localhost:5433（ホスト側。ローカルにネイティブPostgreSQLが5432を使用しているため5433にマッピング） | ✅ 起動済み |

## サービス停止手順

各サービスを停止する場合:

```bash
lsof -ti :5173
lsof -ti :8080
docker compose down
```

**注意:** `kill` / `pkill` は `.claude/settings.json` でブロックされている。PIDを取得してユーザーに伝え、手動で `kill <PID>` を実行してもらうこと。

## トラブルシューティング

問題が発生した場合:
- DB接続エラー → `docker compose ps` で確認後 `docker compose up -d --wait` を再実行
- ポート競合 → 上記「サービス停止手順」を参照してPIDをユーザーに伝える
- Gradleビルド失敗 → `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew clean bootRun` でクリーンビルド
- Java バージョンエラー → `JAVA_HOME` の指定を確認（Java 21必須。`/usr/libexec/java_home -v 21` でパスを取得）
