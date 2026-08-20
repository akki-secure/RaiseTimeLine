import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, PERF_PASSWORD } from './config.ts';

// seed-bulk.sqlで作成済みのperfユーザーでログインし、アクセストークンを取得する。
export function login(email: string): string | null {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password: PERF_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );

  check(res, {
    'login: status is 200': (r) => r.status === 200,
  });

  if (res.status !== 200) {
    return null;
  }
  return res.json('token') as string;
}

export function authHeaders(token: string) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}
