import { test, expect } from '@playwright/test';
import { makeTestUser, registerViaUi } from '../../fixtures/auth';

test.describe('フォロー一覧・横断ナビゲーション', () => {
  test('5.1-5.3 フォロー中一覧の表示・件数一致・一覧からプロフィール遷移', async ({ browser }) => {
    const targetCtx = await browser.newContext();
    const target = makeTestUser('flist-target');
    await registerViaUi(await targetCtx.newPage(), target);
    await targetCtx.close();

    const viewerCtx = await browser.newContext();
    const viewerPage = await viewerCtx.newPage();
    const viewer = makeTestUser('flist-viewer');
    await registerViaUi(viewerPage, viewer);

    await viewerPage.goto(`/profile.html?username=${target.username}`);
    await viewerPage.locator('#profile-follow-btn').click();
    await expect(viewerPage.locator('#profile-follow-btn')).toHaveText('フォロー中');

    // 「フォロー中」リンクはページ所有者（=target）のフォロー中一覧を指すため、
    // viewer自身のフォロー中一覧を見るにはviewer自身のプロフィールに移動する必要がある。
    await viewerPage.goto(`/profile.html?username=${viewer.username}`);
    await viewerPage.locator('#profile-following-link').click();
    await expect(viewerPage).toHaveURL(/follow-list\.html\?username=.*type=following/);
    const followingRow = viewerPage.locator('.user-row').filter({ hasText: target.username });
    await expect(followingRow).toBeVisible();

    await followingRow.locator('.user-row-link').click();
    await expect(viewerPage).toHaveURL(new RegExp(`profile\\.html\\?username=${target.username}`));

    // フォロワー一覧側（target視点）も件数が一致する
    await viewerPage.goto(`/follow-list.html?username=${target.username}&type=followers`);
    const followerRow = viewerPage.locator('.user-row').filter({ hasText: viewer.username });
    await expect(followerRow).toBeVisible();
    await expect(viewerPage.locator('.user-row')).toHaveCount(1);

    await viewerCtx.close();
  });

  test('6.1 プロフィール/フォロー一覧からロゴクリックでタイムラインに戻る', async ({ page }) => {
    const user = makeTestUser('nav');
    await registerViaUi(page, user);

    await page.goto(`/profile.html?username=${user.username}`);
    await page.locator('.app-title').click();
    await expect(page).toHaveURL(/timeline\.html/);

    await page.goto(`/follow-list.html?username=${user.username}&type=following`);
    await page.locator('.app-title').click();
    await expect(page).toHaveURL(/timeline\.html/);
  });
});
