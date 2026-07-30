import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadScripts, runScript } from "../support/loadScripts.js";
import { samplePost } from "../support/testData.js";

const TIMELINE_BODY_HTML = `
  <div class="timeline-page">
    <header class="app-header">
      <div class="header-search">
        <input id="user-search-input" type="text">
        <div id="user-search-results" class="hidden"></div>
      </div>
      <div class="header-right">
        <a id="header-username"></a>
        <button id="logout-btn">ログアウト</button>
      </div>
    </header>
    <section id="suggestions-section" class="hidden">
      <div id="suggestions-list"></div>
    </section>
    <section class="post-form">
      <textarea id="post-body" maxlength="280"></textarea>
      <div class="post-form-image">
        <input type="file" id="post-image-input">
        <img id="post-image-preview" class="hidden">
        <button id="post-image-remove-btn" class="hidden"></button>
      </div>
      <div class="post-form-footer">
        <span id="char-count">0/280</span>
        <button id="post-submit-btn">投稿</button>
      </div>
      <div id="post-form-message"></div>
    </section>
    <section id="post-list"></section>
    <div id="scroll-sentinel"></div>
  </div>
  <div id="new-posts-modal" class="hidden">
    <p id="new-posts-message"></p>
    <button id="new-posts-load-btn">表示する</button>
    <button id="new-posts-dismiss-btn">閉じる</button>
  </div>
`;

function setupPage({ initialPosts = [] } = {}) {
  const dom = loadScripts(
      ["auth.js", "posts.js", "users.js", "comments.js", "likes.js", "user-ui.js", "post-ui.js"],
      { bodyHtml: TIMELINE_BODY_HTML }
  );
  const window = dom.window;
  window.localStorage.setItem("token", "valid-token");
  window.localStorage.setItem("username", "self");
  window.localStorage.setItem("displayName", "自分");

  let observerCallback;
  window.IntersectionObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
  window.URL.createObjectURL = vi.fn().mockReturnValue("blob://preview");
  window.alert = vi.fn();
  window.confirm = vi.fn();
  window.scrollTo = vi.fn();

  const fetchMock = vi.fn(async (url) => {
    if (url.includes("/api/users/suggestions")) {
      return { ok: true, json: async () => [] };
    }
    if (url.includes("/api/posts")) {
      return { ok: true, json: async () => initialPosts };
    }
    return { ok: true, json: async () => [] };
  });
  window.fetch = fetchMock;

  runScript(dom, "timeline.js");

  return { window, fetchMock, getObserverCallback: () => observerCallback };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("timeline.js", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期表示で投稿一覧を描画する", async () => {
    const { window } = setupPage({ initialPosts: [samplePost(2), samplePost(1)] });
    await flush();

    const items = window.document.querySelectorAll("#post-list .post-item");
    expect(items.length).toBe(2);
  });

  it("スクロールで無限スクロールの追加読み込みが発生する", async () => {
    const { window, fetchMock, getObserverCallback } = setupPage({
      initialPosts: Array.from({ length: 20 }, (_, i) => samplePost(20 - i)),
    });
    await flush();
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => [samplePost(0)],
    }));

    getObserverCallback()([{ isIntersecting: true }]);
    await flush();

    const calledUrls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calledUrls.some((u) => u.includes("beforeId=1"))).toBe(true);
  });

  it("投稿フォーム送信で新しい投稿が一覧の先頭に追加される", async () => {
    const { window, fetchMock } = setupPage({ initialPosts: [samplePost(1)] });
    await flush();

    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => samplePost(2, { body: "新しい投稿", mine: true }),
    }));

    const bodyInput = window.document.getElementById("post-body");
    bodyInput.value = "新しい投稿";
    window.document.getElementById("post-submit-btn").dispatchEvent(new window.Event("click"));
    await flush();

    const firstItem = window.document.querySelector("#post-list .post-item");
    expect(firstItem.querySelector(".post-body").textContent).toBe("新しい投稿");
  });

  it("新着投稿ポーリングで通知モーダルが表示される", async () => {
    vi.useFakeTimers();
    const { window, fetchMock } = setupPage({ initialPosts: [samplePost(1)] });
    await vi.advanceTimersByTimeAsync(0);

    fetchMock.mockImplementationOnce(async (url) => {
      if (url.includes("afterId")) {
        return { ok: true, json: async () => [samplePost(2)] };
      }
      return { ok: true, json: async () => [] };
    });

    await vi.advanceTimersByTimeAsync(15000);

    const modal = window.document.getElementById("new-posts-modal");
    expect(modal.className).not.toContain("hidden");
    expect(window.document.getElementById("new-posts-message").textContent).toBe("1件の新着投稿があります");
  });

  it("表示するボタンで新着投稿が一覧の先頭に反映されモーダルが閉じる", async () => {
    vi.useFakeTimers();
    const { window, fetchMock } = setupPage({ initialPosts: [samplePost(1)] });
    await vi.advanceTimersByTimeAsync(0);

    fetchMock.mockImplementationOnce(async (url) => {
      if (url.includes("afterId")) {
        return { ok: true, json: async () => [samplePost(2, { body: "新着本文" })] };
      }
      return { ok: true, json: async () => [] };
    });
    await vi.advanceTimersByTimeAsync(15000);

    window.document.getElementById("new-posts-load-btn").dispatchEvent(new window.Event("click"));

    const firstItem = window.document.querySelector("#post-list .post-item");
    expect(firstItem.querySelector(".post-body").textContent).toBe("新着本文");
    const modal = window.document.getElementById("new-posts-modal");
    expect(modal.className).toContain("hidden");
  });
});
