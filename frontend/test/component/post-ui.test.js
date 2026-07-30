import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadScripts } from "../support/loadScripts.js";
import { samplePost as buildSamplePost } from "../support/testData.js";

function setup() {
  const dom = loadScripts(["post-ui.js"]);
  const window = dom.window;
  window.alert = vi.fn();
  window.confirm = vi.fn();
  window.toggleLike = vi.fn();
  window.deletePost = vi.fn();
  window.updatePost = vi.fn();
  window.fetchComments = vi.fn().mockResolvedValue([]);
  window.createComment = vi.fn();
  window.updateComment = vi.fn();
  window.deleteComment = vi.fn();
  return window;
}

function samplePost(overrides = {}) {
  return buildSamplePost(overrides.id ?? 1, { body: "本文", ...overrides });
}

describe("post-ui.js buildPostElement", () => {
  let window;

  beforeEach(() => {
    window = setup();
  });

  it("いいね未の投稿は🤍と件数を表示する", () => {
    const el = window.buildPostElement(samplePost({ likeCount: 3, likedByMe: false }));

    const likeBtn = el.querySelector(".like-btn");
    expect(likeBtn.textContent).toBe("🤍 3");
    expect(likeBtn.className).toBe("like-btn");
  });

  it("いいね済みの投稿は❤️とlikedクラスを付与する", () => {
    const el = window.buildPostElement(samplePost({ likeCount: 4, likedByMe: true }));

    const likeBtn = el.querySelector(".like-btn");
    expect(likeBtn.textContent).toBe("❤️ 4");
    expect(likeBtn.className).toBe("like-btn liked");
  });

  it("edited=trueなら編集済みラベルを表示する", () => {
    const el = window.buildPostElement(samplePost({ edited: true }));

    expect(el.querySelector(".edited-label")).not.toBeNull();
  });

  it("edited=falseなら編集済みラベルを表示しない", () => {
    const el = window.buildPostElement(samplePost({ edited: false }));

    expect(el.querySelector(".edited-label")).toBeNull();
  });

  it("imageUrlがあれば画像要素を追加する", () => {
    const el = window.buildPostElement(samplePost({ imageUrl: "https://example.com/a.png" }));

    const img = el.querySelector(".post-image");
    expect(img).not.toBeNull();
    expect(img.src).toBe("https://example.com/a.png");
  });

  it("imageUrlが無ければ画像要素を追加しない", () => {
    const el = window.buildPostElement(samplePost());

    expect(el.querySelector(".post-image")).toBeNull();
  });

  it("mine=trueなら編集/削除ボタンを表示する", () => {
    const el = window.buildPostElement(samplePost({ mine: true }));

    expect(el.querySelector(".edit-btn")).not.toBeNull();
    expect(el.querySelector(".delete-btn")).not.toBeNull();
  });

  it("mine=falseなら編集/削除ボタンを表示しない", () => {
    const el = window.buildPostElement(samplePost({ mine: false }));

    expect(el.querySelector(".edit-btn")).toBeNull();
    expect(el.querySelector(".delete-btn")).toBeNull();
  });

  it("いいねボタンクリックでtoggleLikeが投稿IDとボタン要素付きで呼ばれる", async () => {
    window.toggleLike.mockResolvedValue({ liked: true, likeCount: 1 });
    const el = window.buildPostElement(samplePost({ id: 42 }));
    const likeBtn = el.querySelector(".like-btn");

    likeBtn.dispatchEvent(new window.Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.toggleLike).toHaveBeenCalledWith(42);
    expect(likeBtn.textContent).toBe("❤️ 1");
  });

  it("削除ボタンはconfirmでキャンセルするとdeletePostを呼ばない", async () => {
    window.confirm.mockReturnValue(false);
    const el = window.buildPostElement(samplePost({ mine: true }));
    const deleteBtn = el.querySelector(".delete-btn");

    deleteBtn.dispatchEvent(new window.Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.deletePost).not.toHaveBeenCalled();
  });

  it("削除ボタンはconfirmで承認するとdeletePostを呼び要素を削除する", async () => {
    window.confirm.mockReturnValue(true);
    window.deletePost.mockResolvedValue(undefined);
    const parent = window.document.createElement("div");
    const el = window.buildPostElement(samplePost({ id: 7, mine: true }));
    parent.appendChild(el);
    const deleteBtn = el.querySelector(".delete-btn");

    deleteBtn.dispatchEvent(new window.Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.deletePost).toHaveBeenCalledWith(7);
    expect(parent.querySelector(".post-item")).toBeNull();
  });
});
