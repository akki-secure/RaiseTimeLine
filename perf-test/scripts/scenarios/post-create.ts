import http from 'k6/http';
import { check, sleep } from 'k6';
import { login } from '../lib/auth.ts';
import { BASE_URL, randomPerfEmail } from '../lib/config.ts';

// 投稿作成API（POST /api/posts、multipart/form-data）の負荷テスト。
// テキストのみの投稿を対象とする。画像アップロードはAWS S3の認証情報が必要になるため
// デフォルトの対象からは外している（必要な場合はimageフィールドを追加して手動実行する）。
export const options = {
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP_DURATION || '20s', target: Number(__ENV.VUS || 10) },
        { duration: __ENV.DURATION || '1m', target: Number(__ENV.VUS || 10) },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.99'],
  },
};

interface SetupData {
  token: string | null;
}

export function setup(): SetupData {
  const token = login(randomPerfEmail());
  return { token };
}

export default function (data: SetupData) {
  if (!data.token) return;
  // k6のhttp.postはプレーンオブジェクトを渡すとapplication/x-www-form-urlencodedで
  // エンコードしてしまう（http.file()を含む場合のみ自動でmultipart/form-dataになる）。
  // バックエンドはmultipart/form-data固定のため、boundaryを手動で組み立てて送る。
  const boundary = `----k6boundary${Math.random().toString(36).slice(2)}`;
  const text = `perf-test post ${Date.now()}-${Math.random()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="body"\r\n\r\n` +
    `${text}\r\n` +
    `--${boundary}--\r\n`;
  const opts = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    tags: { name: 'post_create' },
  };
  const res = http.post(`${BASE_URL}/api/posts`, body, opts);
  check(res, { 'create: status is 200': (r) => r.status === 200 });
  sleep(1);
}
