import { describe, it, expect, vi } from "vitest";
import { loadScripts } from "../support/loadScripts.js";

function setup() {
  const dom = loadScripts(["auth.js", "comments.js"]);
  dom.window.localStorage.setItem("token", "valid-token");
  return dom.window;
}

describe("comments.js", () => {
  it("fetchCommentsは投稿IDのコメント一覧を取得する", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 1 }] });
    window.fetch = fetchMock;

    const result = await window.fetchComments(5);

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/posts/5/comments");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("createCommentはJSONボディでPOSTする", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    window.fetch = fetchMock;

    await window.createComment(5, "コメント本文");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/posts/5/comments");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ body: "コメント本文" });
  });

  it("updateCommentは失敗時にエラーメッセージ付きの例外を投げる", async () => {
    const window = setup();
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "このコメントを編集する権限がありません" }),
    });

    await expect(window.updateComment(5, 1, "改ざん")).rejects.toThrow(
        "このコメントを編集する権限がありません"
    );
  });

  it("deleteCommentは指定したpostId/commentIdのURLをDELETEする", async () => {
    const window = setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    window.fetch = fetchMock;

    await window.deleteComment(5, 1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/posts/5/comments/1");
    expect(options.method).toBe("DELETE");
  });
});
