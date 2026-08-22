import { test, expect } from '@playwright/test';
import { makeTestUser, registerViaUi } from '../../fixtures/auth';

// 投稿者本人以外によるいいね/コメント、および所有権によるボタン表示制御を
// 2つの独立したブラウザコンテキスト（＝別ユーザーのブラウザセッション）で検証する。
test.describe('所有権・第三者操作', () => {
  test('3.1/3.2 他ユーザーの投稿には編集/削除ボタンが表示されず、第三者はいいねできる', async ({ browser }) => {
    const authorCtx = await browser.newContext();
    const otherCtx = await browser.newContext();
    const authorPage = await authorCtx.newPage();
    const otherPage = await otherCtx.newPage();

    const author = makeTestUser('author');
    const other = makeTestUser('other');
    await registerViaUi(authorPage, author);
    await registerViaUi(otherPage, other);

    const body = `e2e ownership-post ${Date.now()}`;
    await authorPage.locator('#post-body').fill(body);
    await authorPage.locator('#post-submit-btn').click();
    const authorFirstPost = authorPage.locator('.post-item').first();
    await expect(authorFirstPost.locator('.post-body')).toHaveText(body);
    await expect(authorFirstPost.locator('.post-actions')).toBeVisible();

    await otherPage.reload();
    const otherPostCard = otherPage.locator('.post-item').filter({ hasText: body }).first();
    await expect(otherPostCard).toBeVisible();
    await expect(otherPostCard.locator('.post-actions')).toHaveCount(0);

    await otherPostCard.locator('.like-btn').click();
    await expect(otherPostCard.locator('.like-btn')).toHaveClass(/liked/);
    await expect(otherPostCard.locator('.like-btn')).toContainText('1');

    await authorCtx.close();
    await otherCtx.close();
  });

  test('3.3/3.4 第三者がコメントを追加でき、他ユーザーのコメントには編集/削除ボタンが表示されない', async ({ browser }) => {
    const authorCtx = await browser.newContext();
    const otherCtx = await browser.newContext();
    const authorPage = await authorCtx.newPage();
    const otherPage = await otherCtx.newPage();

    const author = makeTestUser('cauthor');
    const other = makeTestUser('cother');
    await registerViaUi(authorPage, author);
    await registerViaUi(otherPage, other);

    const body = `e2e comment-target ${Date.now()}`;
    await authorPage.locator('#post-body').fill(body);
    await authorPage.locator('#post-submit-btn').click();
    const authorPostCard = authorPage.locator('.post-item').first();
    await expect(authorPostCard.locator('.post-body')).toHaveText(body);

    await otherPage.reload();
    const otherPostCard = otherPage.locator('.post-item').filter({ hasText: body }).first();
    await otherPostCard.locator('.comment-toggle-btn').click();

    const commentText = `e2e third-party comment ${Date.now()}`;
    const commentPanel = otherPostCard.locator('.comments-panel');
    await commentPanel.locator('.comment-form textarea').fill(commentText);
    await commentPanel.locator('.comment-form button').click();

    const otherCommentItem = commentPanel.locator('.comment-item').filter({ hasText: commentText });
    await expect(otherCommentItem).toBeVisible();

    // 投稿者側でも同じコメントが第三者のものとして見え、編集/削除ボタンは表示されない
    await authorPostCard.locator('.comment-toggle-btn').click();
    const authorCommentPanel = authorPostCard.locator('.comments-panel');
    const authorSeesComment = authorCommentPanel.locator('.comment-item').filter({ hasText: commentText });
    await expect(authorSeesComment).toBeVisible();
    await expect(authorSeesComment.locator('.comment-actions')).toHaveCount(0);

    await authorCtx.close();
    await otherCtx.close();
  });
});
