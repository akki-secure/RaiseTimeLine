# perf-test

RaiseTimeLineの主要APIに対する負荷テスト（[k6](https://k6.io/)）。

**このディレクトリはCI（GitHub Actionsなど）には組み込まない。** 大きめのリファクタやクエリ・インデックス変更を行った際など、開発者が任意のタイミングで手動実行するためのものです。詳しい位置づけは [docs/testing.md](../docs/testing.md) を参照してください。

## 前提条件

1. k6をインストールする
   ```
   brew install k6
   ```
   （Homebrewを使わない場合はDockerイメージ `grafana/k6` でも実行可能）

2. DBとバックエンドを起動する
   ```
   docker compose up -d
   cd backend && ./gradlew bootRun
   ```

3. 負荷テスト用のシードデータを投入する（初回、またはデータをリセットしたい場合）
   ```
   docker compose exec -T postgres psql -U postgres -d raisetimeline < perf-test/scripts/seed/seed-bulk.sql
   ```
   - `perf-user-1` 〜 `perf-user-200`（パスワード共通: `perfpass123`）と、その投稿・いいねが生成されます。
   - 既存の開発データとは `username LIKE 'perf-user-%'` で区別されるため、混在しません。
   - 再実行すると一旦削除してから再生成されるので、何度実行しても安全です。
   - 削除だけしたい場合は `DELETE FROM users WHERE username LIKE 'perf-user-%';`（`ON DELETE CASCADE`によりposts/likes/commentsも連動して削除されます）。

## 実行方法

```
./perf-test/run.sh <scenario>
```

利用可能なシナリオ（`scripts/scenarios/`配下）:

| シナリオ | 対象API | 目的 |
|---|---|---|
| `login` | POST /api/auth/login | BCrypt検証込みの認証処理性能 |
| `timeline-read` | GET /api/posts（カーソルページング） | タイムライン取得のクエリ性能 |
| `like-toggle` | POST /api/posts/{postId}/likes | 同時いいねトグルでのロック/UNIQUE制約競合 |
| `post-create` | POST /api/posts（テキストのみ） | 投稿作成のINSERTコスト |

### 段階的な実行

まずはスモーク実行で疎通確認してから、本番の負荷設定で実行することを推奨します。

```
# スモーク（VU1・10秒）
VUS=1 DURATION=10s RAMP_DURATION=1s ./perf-test/run.sh login

# 通常負荷（各シナリオのデフォルト値）
./perf-test/run.sh timeline-read

# 環境変数でVU数・実行時間を上書き
VUS=100 DURATION=3m ./perf-test/run.sh timeline-read
```

`BASE_URL`（デフォルト `http://localhost:8080`）も環境変数で上書きできます。

### like-toggleシナリオの対象post指定

`like-toggle`はデフォルトで `postId=1` を叩きます。シードデータの実際のpost idを使いたい場合は、事前にDBで確認して `TARGET_POST_ID` を指定してください。

```
docker compose exec -T postgres psql -U postgres -d raisetimeline -c \
  "SELECT id FROM posts WHERE body LIKE 'perf-seed-post %' LIMIT 1;"

TARGET_POST_ID=1234 ./perf-test/run.sh like-toggle
```

### 実行権限がない場合

`run.sh`に実行権限がない場合は `chmod +x perf-test/run.sh` を実行するか、`bash perf-test/run.sh <scenario>` の形で実行してください。

## 結果の見方

- 実行するとターミナルにk6の標準サマリーが表示されます。各シナリオの`thresholds`（p95応答時間・失敗率）を満たしているかを確認してください。閾値を下回るとk6が非ゼロ終了し、サマリーに`✗`が表示されます。
- 実行結果は `results/<scenario>-<timestamp>.json` にも保存されます（gitignore対象）。複数回実行した結果を見比べたい場合に使ってください。
- 常設のダッシュボード（Grafana等）は導入していません。

## シードパスワードハッシュの再生成手順（参考）

`scripts/seed/seed-bulk.sql` 内のBCryptハッシュは、パスワード `perfpass123` を以下のように生成したものです（Python3 + `pip install bcrypt` が必要）。

```
python3 -c "import bcrypt; print(bcrypt.hashpw(b'perfpass123', bcrypt.gensalt(10)).decode())"
```

パスワードを変更したい場合は、生成したハッシュを `seed-bulk.sql` に反映し、`perf-test/scripts/lib/config.js` の `PERF_PASSWORD` も合わせて変更してください。
