// RaiseTimeLine フォロー中/フォロワー一覧画面ロジック

if (requireAuth()) {
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await logout();
    window.location.href = "login.html";
  });

  const params = new URLSearchParams(window.location.search);
  const username = params.get("username") || "";
  const type = params.get("type") === "followers" ? "followers" : "following";

  const titleEl = document.getElementById("follow-list-title");
  const messageEl = document.getElementById("follow-list-message");
  const listEl = document.getElementById("follow-list");

  if (!username) {
    showError("ユーザーが指定されていません");
  } else {
    load();
  }

  async function load() {
    try {
      const profile = await getUserProfile(username);
      titleEl.textContent = type === "followers"
        ? `${profile.displayName}さんのフォロワー`
        : `${profile.displayName}さんのフォロー中`;

      const users = type === "followers"
        ? await fetchFollowers(username)
        : await fetchFollowing(username);

      if (users.length === 0) {
        const empty = document.createElement("div");
        empty.className = "follow-list-empty";
        empty.textContent = type === "followers" ? "フォロワーがいません" : "誰もフォローしていません";
        listEl.appendChild(empty);
        return;
      }

      users.forEach((u) => listEl.appendChild(buildUserRowElement(u)));
    } catch (err) {
      showError(err.message);
    }
  }

  function showError(message) {
    messageEl.className = "error";
    messageEl.textContent = message;
  }
}
