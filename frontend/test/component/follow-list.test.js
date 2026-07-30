import { describe, it, expect, vi } from "vitest";
import { loadScripts, runScript } from "../support/loadScripts.js";
import { sampleUser } from "../support/testData.js";

const FOLLOW_LIST_BODY_HTML = `
  <header class="app-header">
    <div class="header-right">
      <button id="logout-btn">ログアウト</button>
    </div>
  </header>
  <h1 id="follow-list-title"></h1>
  <div id="follow-list-message"></div>
  <section id="follow-list"></section>
`;

function setupPage({ username = "bob", type = "following" } = {}) {
  const dom = loadScripts(["auth.js", "users.js", "user-ui.js"], {
    bodyHtml: FOLLOW_LIST_BODY_HTML,
    url: `http://localhost/follow-list.html?username=${username}&type=${type}`,
  });
  const window = dom.window;
  window.localStorage.setItem("token", "valid-token");
  window.localStorage.setItem("username", "self");
  window.alert = vi.fn();

  return { dom, window };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("follow-list.js", () => {
  it("typeがfollowingならフォロー中一覧のタイトルと一覧を表示する", async () => {
    const { dom, window } = setupPage({ type: "following" });
    window.fetch = vi.fn(async (url) => {
      if (url.includes("/following")) return { ok: true, json: async () => [sampleUser("carol")] };
      return { ok: true, json: async () => ({ displayName: "Bob" }) };
    });

    runScript(dom, "follow-list.js");
    await flush();

    expect(window.document.getElementById("follow-list-title").textContent).toBe("Bobさんのフォロー中");
    expect(window.document.querySelectorAll("#follow-list .user-row").length).toBe(1);
  });

  it("typeがfollowersならフォロワー一覧のタイトルと一覧を表示する", async () => {
    const { dom, window } = setupPage({ type: "followers" });
    window.fetch = vi.fn(async (url) => {
      if (url.includes("/followers")) return { ok: true, json: async () => [sampleUser("dave"), sampleUser("eve")] };
      return { ok: true, json: async () => ({ displayName: "Bob" }) };
    });

    runScript(dom, "follow-list.js");
    await flush();

    expect(window.document.getElementById("follow-list-title").textContent).toBe("Bobさんのフォロワー");
    expect(window.document.querySelectorAll("#follow-list .user-row").length).toBe(2);
  });

  it("一覧が空なら空状態のメッセージを表示する", async () => {
    const { dom, window } = setupPage({ type: "following" });
    window.fetch = vi.fn(async (url) => {
      if (url.includes("/following")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => ({ displayName: "Bob" }) };
    });

    runScript(dom, "follow-list.js");
    await flush();

    expect(window.document.querySelector(".follow-list-empty").textContent).toBe("誰もフォローしていません");
  });

  it("プロフィール取得失敗時はエラーメッセージを表示する", async () => {
    const { dom, window } = setupPage({ type: "following" });
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "ユーザーが見つかりません" }),
    });

    runScript(dom, "follow-list.js");
    await flush();

    expect(window.document.getElementById("follow-list-message").textContent).toBe("ユーザーが見つかりません");
  });

  it("usernameパラメータが無い場合はエラーメッセージを表示する", async () => {
    const dom = loadScripts(["auth.js", "users.js", "user-ui.js"], {
      bodyHtml: FOLLOW_LIST_BODY_HTML,
      url: "http://localhost/follow-list.html",
    });
    const window = dom.window;
    window.localStorage.setItem("token", "valid-token");
    window.fetch = vi.fn();

    runScript(dom, "follow-list.js");
    await flush();

    expect(window.document.getElementById("follow-list-message").textContent).toBe("ユーザーが指定されていません");
    expect(window.fetch).not.toHaveBeenCalled();
  });
});
