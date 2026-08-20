import type { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

// テストごとに衝突しない使い捨てユーザーを作る。既存のperf-userシードとは名前空間を分ける。
// usernameは3〜20文字制限（register.htmlのpattern）があるため、一意部分は切り詰めずlabel側で長さを調整する。
export function makeTestUser(label: string): TestUser {
  const uniquePart = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const prefix = `e2e${label}`.slice(0, Math.max(3, 19 - uniquePart.length));
  return {
    email: `${prefix}-${uniquePart}@example.com`,
    password: 'E2ePass1234',
    username: `${prefix}-${uniquePart}`,
    displayName: `E2E ${label}`,
  };
}

// register.htmlをUI操作で埋めて送信し、成功（timeline.htmlへの遷移）まで待つ。
export async function registerViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register.html');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('#username').fill(user.username);
  await page.locator('#displayName').fill(user.displayName);
  await page.locator('#submit-btn').click();
  await page.waitForURL('**/timeline.html');
}

export async function loginViaUi(page: Page, user: Pick<TestUser, 'email' | 'password'>): Promise<void> {
  await page.goto('/login.html');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('#submit-btn').click();
  await page.waitForURL('**/timeline.html');
}
