import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadScripts } from "../support/loadScripts.js";

function setup() {
  const dom = loadScripts(["auth.js"]);
  return dom.window;
}

describe("auth.js", () => {
  let window;

  beforeEach(() => {
    window = setup();
  });

  it("saveTokensでlocalStorageにトークンが保存される", () => {
    window.saveTokens({ token: "t1", refreshToken: "r1", username: "taro", displayName: "太郎" });

    expect(window.localStorage.getItem("token")).toBe("t1");
    expect(window.localStorage.getItem("refreshToken")).toBe("r1");
    expect(window.localStorage.getItem("username")).toBe("taro");
  });

  it("clearTokensでlocalStorageからトークンが削除される", () => {
    window.saveTokens({ token: "t1", refreshToken: "r1", username: "taro", displayName: "太郎" });

    window.clearTokens();

    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("refreshToken")).toBeNull();
  });

  it("authFetchは401でなければそのままレスポンスを返す", async () => {
    window.saveTokens({ token: "valid-token", refreshToken: "r1", username: "taro", displayName: "太郎" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    window.fetch = fetchMock;

    const res = await window.authFetch("/api/posts", { method: "GET" });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8080/api/posts",
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer valid-token" }) })
    );
  });

  it("authFetchは401時にリフレッシュ成功後リトライする", async () => {
    window.saveTokens({ token: "expired-token", refreshToken: "r1", username: "taro", displayName: "太郎" });
    const fetchMock = vi.fn()
        .mockResolvedValueOnce({ status: 401, ok: false })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ token: "new-token", refreshToken: "new-refresh", username: "taro", displayName: "太郎" }),
        })
        .mockResolvedValueOnce({ status: 200, ok: true });
    window.fetch = fetchMock;

    const res = await window.authFetch("/api/posts", { method: "GET" });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(window.localStorage.getItem("token")).toBe("new-token");
  });

  it("authFetchは401時にリフレッシュ失敗するとトークンを破棄する", async () => {
    window.saveTokens({ token: "expired-token", refreshToken: "r1", username: "taro", displayName: "太郎" });
    const fetchMock = vi.fn()
        .mockResolvedValueOnce({ status: 401, ok: false })
        .mockResolvedValueOnce({ ok: false, status: 401 });
    window.fetch = fetchMock;

    const res = await window.authFetch("/api/posts", { method: "GET" });

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem("token")).toBeNull();
  });

  it("loginは失敗時にサーバーのmessageを使った例外を投げる", async () => {
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "メールアドレスまたはパスワードが正しくありません" }),
    });

    await expect(window.login("taro@example.com", "wrong")).rejects.toThrow(
        "メールアドレスまたはパスワードが正しくありません"
    );
  });

  it("loginは成功時にトークンを保存して結果を返す", async () => {
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "t1", refreshToken: "r1", username: "taro", displayName: "太郎" }),
    });

    const data = await window.login("taro@example.com", "password123");

    expect(data.username).toBe("taro");
    expect(window.localStorage.getItem("token")).toBe("t1");
  });

  it("extractErrorMessageはmessageが無ければfallbackを返す", async () => {
    const res = { json: async () => { throw new Error("invalid json"); } };

    const message = await window.extractErrorMessage(res, "既定のエラーメッセージ");

    expect(message).toBe("既定のエラーメッセージ");
  });
});
