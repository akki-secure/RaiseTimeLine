import { sleep } from 'k6';
import { login } from '../lib/auth.ts';
import { randomPerfEmail } from '../lib/config.ts';

// ログインAPI（BCrypt検証込み）の負荷テスト。
// 事前に scripts/seed/seed-bulk.sql でperfユーザーを投入しておくこと。
export const options = {
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP_DURATION || '30s', target: Number(__ENV.VUS || 20) },
        { duration: __ENV.DURATION || '1m', target: Number(__ENV.VUS || 20) },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  login(randomPerfEmail());
  sleep(1);
}
