import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadScripts } from "../support/loadScripts.js";
import { sampleUser } from "../support/testData.js";

function setup(currentUsername = "self") {
  const dom = loadScripts(["user-ui.js"]);
  const window = dom.window;
  window.alert = vi.fn();
  window.getUsername = vi.fn().mockReturnValue(currentUsername);
  window.toggleFollow = vi.fn();
  return window;
}

describe("user-ui.js buildUserRowElement", () => {
  it("bioがあれば表示する", () => {
    const window = setup();
    const row = window.buildUserRowElement(sampleUser("bob", { bio: "よろしく" }));

    expect(row.querySelector(".user-row-bio").textContent).toBe("よろしく");
  });

  it("bioが無ければ表示しない", () => {
    const window = setup();
    const row = window.buildUserRowElement(sampleUser("bob", { bio: null }));

    expect(row.querySelector(".user-row-bio")).toBeNull();
  });

  it("自分自身の行にはフォローボタンを表示しない", () => {
    const window = setup("bob");
    const row = window.buildUserRowElement(sampleUser("bob"));

    expect(row.querySelector(".user-row-follow-btn")).toBeNull();
  });

  it("他人の行にはフォローボタンを表示する", () => {
    const window = setup("self");
    const row = window.buildUserRowElement(sampleUser("bob", { followedByMe: false }));

    const btn = row.querySelector("button");
    expect(btn.className).toBe("user-row-follow-btn");
    expect(btn.textContent).toBe("フォローする");
  });

  it("followedByMe=trueならfollowingクラスと文言になる", () => {
    const window = setup("self");
    const row = window.buildUserRowElement(sampleUser("bob", { followedByMe: true }));

    const btn = row.querySelector("button");
    expect(btn.className).toBe("user-row-follow-btn following");
    expect(btn.textContent).toBe("フォロー中");
  });

  it("フォローボタンクリックでtoggleFollowが呼ばれ状態が更新される", async () => {
    const window = setup("self");
    window.toggleFollow.mockResolvedValue({ followed: true });
    const row = window.buildUserRowElement(sampleUser("bob", { followedByMe: false }));
    const btn = row.querySelector("button");

    btn.dispatchEvent(new window.Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.toggleFollow).toHaveBeenCalledWith("bob");
    expect(btn.textContent).toBe("フォロー中");
  });

  it("toggleFollow失敗時はalertでエラーを表示する", async () => {
    const window = setup("self");
    window.toggleFollow.mockRejectedValue(new Error("フォロー操作に失敗しました"));
    const row = window.buildUserRowElement(sampleUser("bob"));
    const btn = row.querySelector("button");

    btn.dispatchEvent(new window.Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.alert).toHaveBeenCalledWith("フォロー操作に失敗しました");
  });
});
