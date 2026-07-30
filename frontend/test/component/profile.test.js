import { describe, it, expect, vi } from "vitest";
import { loadScripts, runScript } from "../support/loadScripts.js";
import { samplePost } from "../support/testData.js";

const PROFILE_BODY_HTML = `
  <header class="app-header">
    <div class="header-right">
      <button id="logout-btn">ログアウト</button>
    </div>
  </header>
  <section id="profile-card" class="hidden">
    <div class="profile-info">
      <div class="profile-name-row">
        <span id="profile-display-name"></span>
        <button id="profile-edit-bio-btn" class="hidden">自己紹介を編集</button>
        <button id="profile-follow-btn" class="hidden"></button>
      </div>
      <span id="profile-username"></span>
      <div class="profile-stats">
        <a id="profile-following-link" href="#"><span id="profile-following-count">0</span></a>
        <a id="profile-followers-link" href="#"><span id="profile-followers-count">0</span></a>
      </div>
      <div id="profile-bio-view"></div>
    </div>
  </section>
  <div id="profile-message"></div>
  <section id="post-list"></section>
  <div id="load-more-wrap">
    <button id="load-more-btn" class="hidden">もっと見る</button>
  </div>
`;

function sampleProfile(overrides = {}) {
  return {
    username: "bob",
    displayName: "Bob",
    bio: "よろしく",
    followedByMe: false,
    followingCount: 3,
    followerCount: 5,
    ...overrides,
  };
}

function setupPage({ username = "bob", profile = sampleProfile(), posts = [] } = {}) {
  const dom = loadScripts(
      ["auth.js", "posts.js", "users.js", "comments.js", "likes.js", "user-ui.js", "post-ui.js"],
      { bodyHtml: PROFILE_BODY_HTML, url: `http://localhost/profile.html?username=${username}` }
  );
  const window = dom.window;
  window.localStorage.setItem("token", "valid-token");
  window.localStorage.setItem("username", "self");
  window.alert = vi.fn();

  const fetchMock = vi.fn(async (url) => {
    if (url.includes(`/api/users/${username}/posts`)) {
      return { ok: true, json: async () => posts };
    }
    if (url.includes(`/api/users/${username}`)) {
      return { ok: true, json: async () => profile };
    }
    return { ok: true, json: async () => ({}) };
  });
  window.fetch = fetchMock;

  runScript(dom, "profile.js");

  return { window, fetchMock };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("profile.js", () => {
  it("プロフィール情報を描画する", async () => {
    const { window } = setupPage();
    await flush();

    expect(window.document.getElementById("profile-display-name").textContent).toBe("Bob");
    expect(window.document.getElementById("profile-username").textContent).toBe("@bob");
    expect(window.document.getElementById("profile-following-count").textContent).toBe("3");
  });

  it("他人のプロフィールはフォローボタンを表示し編集ボタンは隠す", async () => {
    const { window } = setupPage();
    await flush();

    expect(window.document.getElementById("profile-follow-btn").classList.contains("hidden")).toBe(false);
    expect(window.document.getElementById("profile-edit-bio-btn").classList.contains("hidden")).toBe(true);
  });

  it("自分自身のプロフィールは編集ボタンを表示しフォローボタンは隠す", async () => {
    const { window } = setupPage({ username: "self", profile: sampleProfile({ username: "self" }) });
    await flush();

    expect(window.document.getElementById("profile-edit-bio-btn").classList.contains("hidden")).toBe(false);
    expect(window.document.getElementById("profile-follow-btn").classList.contains("hidden")).toBe(true);
  });

  it("投稿一覧を描画しページサイズ未満ならもっと見るボタンを隠す", async () => {
    const { window } = setupPage({ posts: [samplePost(1), samplePost(2)] });
    await flush();

    expect(window.document.querySelectorAll("#post-list .post-item").length).toBe(2);
    expect(window.document.getElementById("load-more-btn").classList.contains("hidden")).toBe(true);
  });

  it("フォローボタンクリックでフォロー状態とフォロワー数が更新される", async () => {
    const { window, fetchMock } = setupPage();
    await flush();
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({ followed: true, followerCount: 6 }),
    }));

    window.document.getElementById("profile-follow-btn").dispatchEvent(new window.Event("click"));
    await flush();

    expect(window.document.getElementById("profile-followers-count").textContent).toBe("6");
    expect(window.document.getElementById("profile-follow-btn").textContent).toBe("フォロー中");
  });

  it("存在しないユーザーはエラーメッセージを表示する", async () => {
    const dom = loadScripts(
        ["auth.js", "posts.js", "users.js", "comments.js", "likes.js", "user-ui.js", "post-ui.js"],
        { bodyHtml: PROFILE_BODY_HTML, url: "http://localhost/profile.html?username=nobody" }
    );
    const window = dom.window;
    window.localStorage.setItem("token", "valid-token");
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "ユーザーが見つかりません" }),
    });

    runScript(dom, "profile.js");
    await flush();

    expect(window.document.getElementById("profile-message").textContent).toBe("ユーザーが見つかりません");
  });
});
