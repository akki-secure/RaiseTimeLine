import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders } from '../lib/auth.ts';
import { randomPerfEmail, BASE_URL } from '../lib/config.ts';

// いいねトグルAPIの負荷テスト。
// 複数VUが同一postIdに同時アクセスすることでUNIQUE制約(post_id, user_id)まわりの
// ロック競合・レスポンス劣化を検出することを狙う。
const TARGET_POST_ID = Number(__ENV.TARGET_POST_ID || 1);

export const options = {
  scenarios: {
    default: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 30),
      duration: __ENV.DURATION || '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
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
  const opts = Object.assign({ tags: { name: 'like_toggle' } }, authHeaders(data.token));
  const res = http.post(`${BASE_URL}/api/posts/${TARGET_POST_ID}/likes`, null, opts);
  check(res, { 'like: status is 200': (r) => r.status === 200 });
  sleep(0.5);
}
