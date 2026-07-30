import { describe, it, expect, vi } from "vitest";
import { loadScripts } from "../support/loadScripts.js";

function setup() {
  const dom = loadScripts(["auth.js", "posts.js"]);
  dom.window.localStorage.setItem("token", "valid-token");
  return dom.window;
}

describe("posts.js", () => {
  it("fetchPostsはbeforeId/afterId/limitをクエリパラメータに含める", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    window.fetch = fetchMock;

    await window.fetchPosts({ beforeId: 5, limit: 10 });

    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("beforeId=5");
    expect(url).toContain("limit=10");
    expect(url).not.toContain("afterId");
  });

  it("fetchPostsは引数無しでもクエリ無しで呼べる", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    window.fetch = fetchMock;

    await window.fetchPosts();

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/posts");
  });

  it("fetchPostsは失敗時にエラーメッセージ付きの例外を投げる", async () => {
    const window = setup();
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "投稿の取得に失敗しました" }),
    });

    await expect(window.fetchPosts()).rejects.toThrow("投稿の取得に失敗しました");
  });

  it("createPostはContent-Typeヘッダーを指定せずFormDataで送信する", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    window.fetch = fetchMock;

    await window.createPost("本文", null);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/posts");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(window.FormData);
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  it("updatePostはJSONボディでPUTする", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, body: "更新後" }) });
    window.fetch = fetchMock;

    await window.updatePost(1, "更新後");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/posts/1");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ body: "更新後" });
  });

  it("deletePostは失敗時に例外を投げる", async () => {
    const window = setup();
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "投稿の削除に失敗しました" }),
    });

    await expect(window.deletePost(1)).rejects.toThrow("投稿の削除に失敗しました");
  });
});
