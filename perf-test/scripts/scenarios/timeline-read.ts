import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders } from '../lib/auth.ts';
import { BASE_URL, randomPerfEmail } from '../lib/config.ts';

// タイムライン取得API（GET /api/posts、カーソルページング）の負荷テスト。
// 1ユーザーが最初のページを取得後、beforeIdを引き継いで連鎖的にページングする挙動を再現する。
export const options = {
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP_DURATION || '30s', target: Number(__ENV.VUS || 50) },
        { duration: __ENV.DURATION || '2m', target: Number(__ENV.VUS || 50) },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
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
  const opts = Object.assign({ tags: { name: 'timeline_page1' } }, authHeaders(data.token));

  const first = http.get(`${BASE_URL}/api/posts?limit=20`, opts);
  check(first, { 'page1: status is 200': (r) => r.status === 200 });

  const posts = first.status === 200 ? (first.json() as Array<{ id: number }>) : [];
  if (Array.isArray(posts) && posts.length > 0) {
    const beforeId = posts[posts.length - 1].id;
    const nextOpts = Object.assign({ tags: { name: 'timeline_page2' } }, authHeaders(data.token));
    const second = http.get(`${BASE_URL}/api/posts?limit=20&beforeId=${beforeId}`, nextOpts);
    check(second, { 'page2: status is 200': (r) => r.status === 200 });
  }

  sleep(1);
}
