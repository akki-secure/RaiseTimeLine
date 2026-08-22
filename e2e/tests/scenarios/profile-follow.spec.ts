import { test, expect } from '@playwright/test';
import { makeTestUser, registerViaUi } from '../../fixtures/auth';

test.describe('ユーザー検索・プロフィール・フォロー', () => {
  test('4.1 ユーザー検索 → 結果クリックでプロフィール遷移', async ({ page, browser }) => {
    const target = makeTestUser('search-target');
    const targetCtx = await browser.newContext();
    await registerViaUi(await targetCtx.newPage(), target);
    await targetCtx.close();

    const viewer = makeTestUser('search-viewer');
    await registerViaUi(page, viewer);

    await page.locator('#user-search-input').fill(target.username);
    const resultRow = page.locator('#user-search-results .user-row').filter({ hasText: target.username });
    await expect(resultRow).toBeVisible();
    await resultRow.locator('.user-row-link').click();

    await expect(page).toHaveURL(new RegExp(`profile\\.html\\?username=${target.username}`));
    await expect(page.locator('#profile-display-name')).toHaveText(target.displayName);
  });

  test('4.2 本人プロフィール → 自己紹介を編集できる', async ({ page }) => {
    const user = makeTestUser('bio');
    await registerViaUi(page, user);
    await page.goto(`/profile.html?username=${user.username}`);

    await expect(page.locator('#profile-edit-bio-btn')).toBeVisible();
    await expect(page.locator('#profile-follow-btn')).toBeHidden();

    await page.locator('#profile-edit-bio-btn').click();
    const bio = `e2e bio ${Date.now()}`;
    await page.locator('#profile-bio-view textarea').fill(bio);
    await page.locator('#profile-bio-view button').filter({ hasText: '保存' }).click();

    await expect(page.locator('#profile-bio-view')).toHaveText(bio);
  });

  test('4.3-4.5 他人プロフィールではフォロー/フォロー解除ができ、編集ボタンは表示されない', async ({ browser }) => {
    const targetCtx = await browser.newContext();
    const target = makeTestUser('follow-target');
    await registerViaUi(await targetCtx.newPage(), target);
    await targetCtx.close();

    const viewerCtx = await browser.newContext();
    const viewerPage = await viewerCtx.newPage();
    const viewer = makeTestUser('follower');
    await registerViaUi(viewerPage, viewer);

    await viewerPage.goto(`/profile.html?username=${target.username}`);
    await expect(viewerPage.locator('#profile-edit-bio-btn')).toBeHidden();
    const followBtn = viewerPage.locator('#profile-follow-btn');
    await expect(followBtn).toHaveText('フォローする');

    await followBtn.click();
    await expect(followBtn).toHaveText('フォロー中');
    await expect(viewerPage.locator('#profile-followers-count')).toHaveText('1');

    await followBtn.click();
    await expect(followBtn).toHaveText('フォローする');
    await expect(viewerPage.locator('#profile-followers-count')).toHaveText('0');

    await viewerCtx.close();
  });
});
