import { describe, it, expect, vi } from "vitest";
import { loadScripts } from "../support/loadScripts.js";

function setup() {
  const dom = loadScripts(["auth.js", "likes.js"]);
  dom.window.localStorage.setItem("token", "valid-token");
  return dom.window;
}

describe("likes.js", () => {
  it("toggleLikeは指定postIdのURLをPOSTし結果を返す", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ liked: true, likeCount: 1 }) });
    window.fetch = fetchMock;

    const result = await window.toggleLike(5);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/posts/5/likes");
    expect(options.method).toBe("POST");
    expect(result).toEqual({ liked: true, likeCount: 1 });
  });

  it("toggleLikeは失敗時にエラーメッセージ付きの例外を投げる", async () => {
    const window = setup();
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "投稿が見つかりません" }),
    });

    await expect(window.toggleLike(999)).rejects.toThrow("投稿が見つかりません");
  });
});
