# e2e

RaiseTimeLineの主要な画面遷移・ユーザー操作に対するE2Eテスト（[Playwright](https://playwright.dev/)、TypeScript）。

**このディレクトリはCI（GitHub Actionsなど）には組み込まない。** `perf-test/`と同様、大きめのリファクタや画面変更を行った際など、開発者が任意のタイミングで手動実行するためのものです。詳しい位置づけは [docs/testing.md](../docs/testing.md) を参照してください。

## 前提条件

1. DB・バックエンド・フロントエンドを起動する（プロジェクトルートの[README.md](../README.md#起動方法)を参照、または `/start` スキルで一括起動）
   ```
   docker compose up -d --wait
   cd backend && ./gradlew bootRun
   cd frontend && python3 -m http.server 5500
   ```

2. 依存関係とブラウザをインストールする（初回のみ）
   ```
   cd e2e
   npm install
   npx playwright install --with-deps chromium
   ```

## 実行方法

### シナリオテスト（`tests/scenarios/`）

```
cd e2e
npx playwright test tests/scenarios
```

- `npm test` でも同じコマンドが実行できる
- ブラウザを表示しながら確認したい場合: `npm run test:headed`
- 失敗時は `playwright-report/`（HTMLレポート）とtrace（`test-results/`）で原因を追える。レポートを開く: `npx playwright show-report`

各テストは`register.html`をUI操作で経由してその場限りのユーザーを作成する（既存の開発データや`perf-test`のperfユーザーとは名前空間が異なるため混在しない）。所有権・第三者操作系のシナリオ（`ownership.spec.ts`等）は、Playwrightの独立したブラウザコンテキストを使って複数ユーザーを同時に操作する。

### ブラウザパフォーマンス計測（`tests/perf/`）

```
cd e2e
npx playwright test tests/perf
```

- ログイン→タイムライン遷移、タイムライン初期表示、投稿送信→DOM反映、いいねクリック→UI反映のタイミングを計測する
- `perf-test/`（k6によるAPIレイヤーの負荷テスト）とは異なり、こちらは実ブラウザでの体感速度を見るためのもの
- 結果はターミナルに表として出力されるほか、`results/page-timing-<timestamp>.json`にも保存される（gitignore対象）
- 閾値は明らかな異常を検知する程度の緩い設定で、継続的な性能監視やキャパシティプランニングは対象外

## トラブルシューティング

- `baseURL`（`http://localhost:5500`）は`playwright.config.ts`で固定。フロントエンドを別ポートで起動している場合は設定を変更する
- テストがタイムアウトする場合、backend（8080）が起動しているか、CORS設定（`SecurityConfig`）がフロントエンドのオリジンを許可しているかを確認する
