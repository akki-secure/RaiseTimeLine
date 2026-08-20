import { test, expect } from '@playwright/test';
import { makeTestUser, registerViaUi, loginViaUi } from '../../fixtures/auth';

test.describe('認証', () => {
  test('1.1 新規登録 → 自動ログイン → タイムライン表示', async ({ page }) => {
    const user = makeTestUser('reg');
    await registerViaUi(page, user);
    await expect(page).toHaveURL(/timeline\.html/);
    await expect(page.locator('#header-username')).toHaveText(user.displayName);
  });

  test('1.2 ログイン成功 → タイムライン表示', async ({ page }) => {
    const user = makeTestUser('login');
    await registerViaUi(page, user);
    await page.locator('#logout-btn').click();
    await expect(page).toHaveURL(/login\.html/);

    await loginViaUi(page, user);
    await expect(page).toHaveURL(/timeline\.html/);
  });

  test('1.3 ログイン失敗（パスワード誤り）→ エラーメッセージ表示、画面遷移しない', async ({ page }) => {
    const user = makeTestUser('badpw');
    await registerViaUi(page, user);
    await page.locator('#logout-btn').click();

    await page.goto('/login.html');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill('WrongPassword1');
    await page.locator('#submit-btn').click();

    await expect(page.locator('#message')).not.toBeEmpty();
    await expect(page).toHaveURL(/login\.html/);
  });

  test('1.4 未ログインで保護ページに直接アクセス → ログイン画面へリダイレクト', async ({ page }) => {
    for (const path of ['/timeline.html', '/profile.html?username=someone', '/follow-list.html?username=someone']) {
      await page.goto(path);
      await expect(page).toHaveURL(/login\.html/);
    }
  });

  test('1.5 ログアウト後は保護ページへの再アクセスもブロックされる', async ({ page }) => {
    const user = makeTestUser('logout');
    await registerViaUi(page, user);
    await page.locator('#logout-btn').click();
    await expect(page).toHaveURL(/login\.html/);

    await page.goto('/timeline.html');
    await expect(page).toHaveURL(/login\.html/);
  });
});
