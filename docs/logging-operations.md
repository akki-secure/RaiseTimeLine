# ログ運用・監視設計

RaiseTimeLineのバックエンド（Spring Boot）における構造化ログの設計方針をまとめたドキュメント。

## 1. 目的とスコープ

- 障害調査・動作確認を「誰が・いつ・何を・どうなったか」で追跡できるようにするため、ログをJSON形式（構造化ログ）で出力する。
- 本プロジェクトは学習目的の個人開発であり、Datadog等の外部監視SaaSは導入していない。本章以降は「もし本番運用するならどう設計すべきか」という思考過程を残すためのドキュメントであり、実装は自アプリのログ出力（コンソール + ファイル）の範囲にとどめている。

## 2. ログレベルの使い分け基準

| レベル | 使う場面 | 本アプリでの例 |
|---|---|---|
| ERROR | 予期しない例外・システム障害。運用者が即座に気づくべきもの | `GlobalExceptionHandler`の汎用`RuntimeException`ハンドラ（`unhandled_exception`） |
| WARN | 異常だがシステムは継続可能。ユーザー起因の入力ミスや認証失敗など | ログイン失敗（`login_failed`）、JWT検証失敗（`jwt_validation_failed`）、入力バリデーションエラー（`validation_failed`）、404/403系例外 |
| INFO | 通常の動作記録 | HTTPアクセスログ（`http_request`、2xx/3xx時）、ログイン成功（`login_success`） |
| DEBUG | 開発者向けの詳細情報（今回は未使用、必要時にルートロガーを下げて有効化） | — |

アンチパターンとして、「何でもERRORにする」「WARNを使わずINFOで済ませる」は避ける。ERRORが埋もれると本当に重大な障害に気づけなくなるため、ユーザー起因のエラー（400/403/404系）はWARN、システム側の予期しない失敗のみERRORとする。

この方針をコード側でも徹底するため、投稿本文の未入力・文字数超過などの入力バリデーションエラーは専用の`ValidationException`（`com.raisetimeline.exception.ValidationException`）としてthrowし、`GlobalExceptionHandler`で400+WARN（スタックトレースなし）として扱う。汎用`RuntimeException`ハンドラ（ERROR+スタックトレース）は、S3保存失敗など本当に予期しないシステムエラーのみに使う設計とした。

## 3. ログのフォーマットとフィールド定義

`logstash-logback-encoder`の`LogstashEncoder`を使い、共通フィールドに加えてMDC（Mapped Diagnostic Context）の内容を自動でJSONに展開する。

### 共通フィールド

| フィールド | 内容 |
|---|---|
| `@timestamp` | ログ出力時刻 |
| `level` | ログレベル |
| `logger_name` | 出力元クラス |
| `message` | イベント名（例: `http_request`, `login_failed`） |
| `requestId` | リクエスト単位のトレースID（`RequestLoggingFilter`がMDCにセット） |
| `userId` | 認証済みユーザーID（未認証時は含まれない） |

### イベント別フィールド

| イベント(message) | 出力元 | 主なフィールド |
|---|---|---|
| `http_request` | `RequestLoggingFilter` | `method`, `path`, `status`, `durationMs` |
| `login_success` | `AuthService.login` | `userId` |
| `login_failed` | `AuthService.login` | `email`, `reason`(`blank_credentials`/`email_not_found`/`password_mismatch`) |
| `jwt_validation_failed` | `JwtAuthFilter` | `path` |
| `validation_failed` | `GlobalExceptionHandler`（`ValidationException`） | `path`, `message` |
| `post_not_found` / `user_not_found` / `comment_not_found` / `invalid_image` / `forbidden` 等 | `GlobalExceptionHandler` | `path`, `message` |
| `unhandled_exception` | `GlobalExceptionHandler`（汎用`RuntimeException`、想定外のみ） | `path`, `exceptionType`, スタックトレース |

## 4. 保存先・保持期間・ローテーション方針

- **コンソール出力**: 標準出力にJSON形式で出す。コンテナ環境（Docker等）で運用する場合、標準出力はログドライバ経由で外部へ収集されるのが一般的なパターン。
- **ファイル出力**: `backend/logs/raisetimeline.log`にJSON形式で出力（Gitには含めない、`.gitignore`で除外）。
  - ローテーション: 日次 + 100MB到達で分割、`.gz`圧縮
  - 保持期間: `maxHistory=14`（2週間）
  - 総容量上限: `totalSizeCap=1GB`（ディスク枯渇防止）
  - この値は学習用途の目安であり、本番運用ではログの重要度・法令要件（監査ログの保存義務等）に応じて数ヶ月〜数年単位で見直す必要がある。
- **本来の本番運用ならどうすべきか**: コンテナのローカルディスクにログを溜め続けるのは障害時に失われるリスクがあるため、S3等のオブジェクトストレージへの定期アーカイブ、またはCloudWatch Logs等のマネージドログサービスへの転送が望ましい。保持期間とストレージコストはトレードオフになるため、重要度に応じて「直近はホットストレージ、古いものは低コストストレージへ移行（ライフサイクルポリシー）」という段階的な設計が一般的。

## 5. トレーサビリティ設計

- `RequestLoggingFilter`がリクエストごとに`requestId`（UUID）を採番し、MDCにセットする。
- MDCの値は同一スレッド内で出力される全てのログに自動付与されるため、1つのHTTPリクエスト処理中に発生した`login_failed`や`unhandled_exception`等のログも、同じ`requestId`で紐付けて追跡できる。
- `userId`も同様にMDC経由で付与し、「あるユーザーが何をしたか」を横断的に追える。
- 本アプリは単一サービス構成のため、サービス間をまたぐ分散トレーシング（OpenTelemetry等でtraceIdをHTTPヘッダ越しに伝播する仕組み）は不要と判断し導入していない。将来マイクロサービス化する場合は、`requestId`をトレースIDとして下流サービスへヘッダ伝播する設計に拡張できる。

## 6. 監視・アラート方針（将来構想）

外部の監視ツールは今回導入していないが、本来設計するならという観点で考え方のみ記す。

- **ログの集計・可視化**: 構造化ログはフィールドごとに集計しやすいため、`status`別のリクエスト件数やレイテンシ(`durationMs`)の分布を集計し、ダッシュボード化する運用が考えられる。
- **アラートの考え方**（実装はしない、設計方針のみ）:
  - 5xx系レスポンスの発生率が閾値を超えた場合に通知する
  - 短時間に`login_failed`が連続する場合（ブルートフォース攻撃の疑い）に通知する
  - `unhandled_exception`が発生した時点で即座に通知する
- **アラート疲れ（alert fatigue）対策**: 閾値を厳しくしすぎると通知が頻発し、重要な通知が見逃されるようになる。「本当に対応が必要なものだけ通知する」ことを意識し、閾値は運用しながら調整するのが望ましい。

## 7. セキュリティ・プライバシー配慮

- パスワードは平文・ハッシュ問わず一切ログに出力しない（`login_failed`のログにも`email`のみを含め、`password`は含めない）。
- メールアドレスはログイン失敗理由の調査に必要なため出力しているが、個人情報である点に留意する。本番相当の運用であれば、ドメイン部分のみ残す・ハッシュ化するなどのマスキング方針を検討すべき。
- ユーザーへ返すエラーメッセージ（例: 「メールアドレスまたはパスワードが正しくありません」）は、ログイン失敗の理由（メール不存在かパスワード不一致か）を区別せず統一している。これはログにだけ詳細な理由（`reason`フィールド）を残し、レスポンス上は情報を絞ることで、第三者によるメールアドレスの存在確認（アカウント列挙攻撃）を防ぐ設計を維持している。

## 8. 動作確認方法

curlは使わず、ブラウザ操作とログファイル閲覧で確認する。

1. アプリ起動後、`backend/logs/raisetimeline.log`がJSON1行1レコードで生成されることを確認する。
2. ブラウザでタイムラインを表示し、`GET /api/posts`等の`http_request`ログ（`status`/`method`/`path`/`durationMs`付き）を確認する。ブラウザDevToolsのNetworkタブとも突き合わせる。
3. 正しい/誤ったパスワードでログインし、`login_success`/`login_failed`ログを確認する。
4. ブラウザのlocalStorageに保存されたアクセストークンを書き換え、認証必須APIにアクセスして`jwt_validation_failed`ログと401レスポンスを確認する。
5. 存在しない投稿への直リンク等で404系エラーを発生させ、`GlobalExceptionHandler`のWARNログを確認する。
6. 起動中のターミナル（コンソール出力）にも同内容がJSON形式で出力されることを確認する。

## 9. 今後の発展案（学習メモ）

- OpenTelemetryによる分散トレーシングの導入（マイクロサービス化した場合）
- ELK Stack / OpenSearchによる自前ログ集約基盤の構築
- Datadog / New Relic等のAPM SaaS導入時の移行ステップ（エージェント導入 → ログ転送設定 → ダッシュボード/アラート設定）
