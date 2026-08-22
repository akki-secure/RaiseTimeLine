import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { makeTestUser, registerViaUi } from '../../fixtures/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// PNG最小画像（timeline.htmlのaccept="image/jpeg,image/png,image/gif,image/webp"に合致）
const FIXTURE_IMAGE = path.join(__dirname, '..', '..', 'fixtures', 'sample.png');

test.describe('タイムライン・投稿', () => {
  test.beforeEach(async ({ page }) => {
    const user = makeTestUser('post');
    await registerViaUi(page, user);
  });

  test('2.1 テキスト投稿 → 一覧に即時反映', async ({ page }) => {
    const body = `e2e post ${Date.now()}`;
    await page.locator('#post-body').fill(body);
    await page.locator('#post-submit-btn').click();

    const firstPost = page.locator('.post-item').first();
    await expect(firstPost.locator('.post-body')).toHaveText(body);
  });

  test('2.2 画像付き投稿 → 投稿カードに画像が表示される', async ({ page }) => {
    const body = `e2e image post ${Date.now()}`;
    await page.locator('#post-body').fill(body);
    await page.locator('#post-image-input').setInputFiles(FIXTURE_IMAGE);
    await expect(page.locator('#post-image-preview')).toBeVisible();
    await page.locator('#post-submit-btn').click();

    const firstPost = page.locator('.post-item').first();
    await expect(firstPost.locator('.post-body')).toHaveText(body);
    await expect(firstPost.locator('.post-image')).toBeVisible();
  });

  test('2.3 本文が空のままでは投稿できない', async ({ page }) => {
    const countBefore = await page.locator('.post-item').count();
    await page.locator('#post-body').fill('   ');
    await page.locator('#post-submit-btn').click();
    await expect(page.locator('.post-item')).toHaveCount(countBefore);
  });

  test('2.4 自分の投稿を編集 → 内容が更新される', async ({ page }) => {
    const original = `e2e edit-before ${Date.now()}`;
    await page.locator('#post-body').fill(original);
    await page.locator('#post-submit-btn').click();

    const firstPost = page.locator('.post-item').first();
    await firstPost.locator('.edit-btn').click();

    const updated = `e2e edit-after ${Date.now()}`;
    await firstPost.locator('.edit-textarea').fill(updated);
    await firstPost.locator('.save-btn').click();

    await expect(firstPost.locator('.post-body')).toHaveText(updated);
  });

  test('2.5 自分の投稿を削除 → 一覧から消える', async ({ page }) => {
    const body = `e2e delete-target ${Date.now()}`;
    await page.locator('#post-body').fill(body);
    await page.locator('#post-submit-btn').click();

    const firstPost = page.locator('.post-item').first();
    await expect(firstPost.locator('.post-body')).toHaveText(body);

    page.once('dialog', (dialog) => dialog.accept());
    await firstPost.locator('.delete-btn').click();

    await expect(page.locator('.post-item').first().locator('.post-body')).not.toHaveText(body);
  });
});
