// perf-test共通設定。BASE_URLやVUS/DURATIONは環境変数で上書きできる。
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// generate-seed-hash.sh で発行したperfユーザーの共通パスワード。
// seed-bulk.sql内のパスワードハッシュと必ず対応させること。
export const PERF_PASSWORD = __ENV.PERF_PASSWORD || 'perfpass123';

// seed-bulk.sqlで作成するperfユーザー数。シナリオ側でランダムに1人を選ぶ際に使う。
export const PERF_USER_COUNT = Number(__ENV.PERF_USER_COUNT || 200);

export function randomPerfUsername(): string {
  const n = Math.floor(Math.random() * PERF_USER_COUNT) + 1;
  return `perf-user-${n}`;
}

export function randomPerfEmail(): string {
  const n = Math.floor(Math.random() * PERF_USER_COUNT) + 1;
  return `perf-user-${n}@example.com`;
}
