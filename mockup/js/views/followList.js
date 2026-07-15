// views/followList.js
// フォロー中一覧画面 / フォロワー一覧画面

function renderFollowList({ username, type }) {
  const user = Repo.getUserByUsername(username);
  if (!user) {
    navigate("/timeline");
    return;
  }
  const isFollowing = type === "following";
  const title = isFollowing ? "フォロー中" : "フォロワー";

  const main = mountShell({
    active: "",
    headerTitle: `${escapeHtml(user.displayName)}さんの${title}`,
    showBack: true,
    rightHtml: suggestionsHtml(),
  });

  const renderAll = () => {
    const list = isFollowing ? Repo.getFollowing(user.id) : Repo.getFollowers(user.id);
    main.innerHTML = `
      <div class="list-header">
        <div class="sub">${title}（${list.length}）</div>
      </div>
      <div id="followListBody">
        ${
          list.length
            ? list.map((u) => userRowHtml(u)).join("")
            : `<div class="empty-state">${isFollowing ? "誰もフォローしていません" : "フォロワーがいません"}</div>`
        }
      </div>
    `;
    attachUserRowEvents(document.getElementById("followListBody"), { onChange: renderAll });
  };

  renderAll();
  attachSuggestionEvents(document.querySelector(".right-col"));
}

registerRoute("/u/:username/following", (params) => renderFollowList({ ...params, type: "following" }));
registerRoute("/u/:username/followers", (params) => renderFollowList({ ...params, type: "followers" }));
