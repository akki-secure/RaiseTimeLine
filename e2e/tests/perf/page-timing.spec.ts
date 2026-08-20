import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { makeTestUser, registerViaUi } from '../../fixtures/auth';

// 実ブラウザでの体感速度を計測する。perf-test/（k6、APIレイヤーの負荷）とは棲み分け、
// こちらはNavigation Timing APIおよび操作前後のwall-clock差分でブラウザ側のタイミングを見る。
// CIには組み込まず、明らかな異常のみをソフトに検知する（閾値は緩め、通常は結果を記録するのが主目的）。

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, '..', '..', 'results');

interface TimingRecord {
  name: string;
  metric: string;
  ms: number;
}

const records: TimingRecord[] = [];

async function getNavigationTiming(page: Page) {
  return page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return {
      ttfb: nav.responseStart - nav.startTime,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
    };
  });
}

test.describe('ブラウザパフォーマンス計測', () => {
  test('7.1 ログイン → タイムライン遷移のNavigation Timing', async ({ page }) => {
    const user = makeTestUser('perf-login');
    await registerViaUi(page, user);
    await page.locator('#logout-btn').click();

    await page.goto('/login.html');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(user.password);
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/timeline.html');
    await page.waitForLoadState('load');

    const timing = await getNavigationTiming(page);
    records.push(
      { name: 'login-to-timeline', metric: 'domContentLoaded', ms: timing.domContentLoaded },
      { name: 'login-to-timeline', metric: 'load', ms: timing.load },
    );
    expect(timing.load).toBeLessThan(10_000);
  });

  test('7.2 タイムライン初期表示（リロード）のNavigation Timing', async ({ page }) => {
    const user = makeTestUser('perf-tl');
    await registerViaUi(page, user);

    await page.reload();
    await page.waitForLoadState('load');
    await expect(page.locator('#post-list .post-item').first()).toBeVisible();

    const timing = await getNavigationTiming(page);
    records.push(
      { name: 'timeline-reload', metric: 'domContentLoaded', ms: timing.domContentLoaded },
      { name: 'timeline-reload', metric: 'load', ms: timing.load },
    );
    expect(timing.load).toBeLessThan(10_000);
  });

  test('7.3 投稿送信クリック → DOM反映までの時間', async ({ page }) => {
    const user = makeTestUser('perf-post');
    await registerViaUi(page, user);

    const body = `e2e perf post ${Date.now()}`;
    await page.locator('#post-body').fill(body);

    const start = Date.now();
    await page.locator('#post-submit-btn').click();
    await expect(page.locator('.post-item').first().locator('.post-body')).toHaveText(body);
    const elapsed = Date.now() - start;

    records.push({ name: 'post-create', metric: 'click-to-dom-reflect', ms: elapsed });
    expect(elapsed).toBeLessThan(5_000);
  });

  test('7.4 いいねクリック → UI反映までの時間', async ({ page }) => {
    const user = makeTestUser('perf-like');
    await registerViaUi(page, user);

    const body = `e2e perf like ${Date.now()}`;
    await page.locator('#post-body').fill(body);
    await page.locator('#post-submit-btn').click();
    const firstPost = page.locator('.post-item').first();
    await expect(firstPost.locator('.post-body')).toHaveText(body);
    const likeBtn = firstPost.locator('.like-btn');

    const start = Date.now();
    await likeBtn.click();
    await expect(likeBtn).toHaveClass(/liked/);
    const elapsed = Date.now() - start;

    records.push({ name: 'like-toggle', metric: 'click-to-ui-reflect', ms: elapsed });
    expect(elapsed).toBeLessThan(3_000);
  });

  test.afterAll(() => {
    if (records.length === 0) return;
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(RESULTS_DIR, `page-timing-${timestamp}.json`);
    fs.writeFileSync(outFile, JSON.stringify(records, null, 2));
    console.log(`[perf] タイミング計測結果を書き出しました: ${outFile}`);
    console.table(records);
  });
});
