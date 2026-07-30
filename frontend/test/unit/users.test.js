import { describe, it, expect, vi } from "vitest";
import { loadScripts } from "../support/loadScripts.js";

function setup() {
  const dom = loadScripts(["auth.js", "users.js"]);
  dom.window.localStorage.setItem("token", "valid-token");
  return dom.window;
}

describe("users.js", () => {
  it("searchUsersはqをクエリパラメータに含める", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    window.fetch = fetchMock;

    await window.searchUsers("たろう");

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/users/search?q=%E3%81%9F%E3%82%8D%E3%81%86");
  });

  it("getUserProfileはusernameをエンコードしてパスに含める", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.fetch = fetchMock;

    await window.getUserProfile("taro/hack");

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/users/taro%2Fhack");
  });

  it("updateMyBioはJSONボディでPUTする", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.fetch = fetchMock;

    await window.updateMyBio("よろしく");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/users/me");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ bio: "よろしく" });
  });

  it("toggleFollowは失敗時にエラーメッセージ付きの例外を投げる", async () => {
    const window = setup();
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "フォロー操作に失敗しました" }),
    });

    await expect(window.toggleFollow("bob")).rejects.toThrow("フォロー操作に失敗しました");
  });

  it("fetchSuggestionsはlimit未指定ならクエリ無しで呼ぶ", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    window.fetch = fetchMock;

    await window.fetchSuggestions();

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/users/suggestions");
  });
});
