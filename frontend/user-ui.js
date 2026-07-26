// RaiseTimeLine ユーザー行の共通UI構築ロジック
// profile.js / follow-list.js / timeline.js（おすすめユーザー欄・検索結果）から共有される。

function buildUserRowElement(user) {
  const row = document.createElement("div");
  row.className = "user-row";

  const link = document.createElement("a");
  link.className = "user-row-link";
  link.href = `profile.html?username=${encodeURIComponent(user.username)}`;

  const avatar = document.createElement("span");
  avatar.className = "user-row-avatar";
  avatar.textContent = "🧑";

  const info = document.createElement("div");
  info.className = "user-row-info";

  const name = document.createElement("span");
  name.className = "user-row-display-name";
  name.textContent = user.displayName;

  const username = document.createElement("span");
  username.className = "user-row-username";
  username.textContent = `@${user.username}`;

  info.append(name, username);

  if (user.bio) {
    const bio = document.createElement("div");
    bio.className = "user-row-bio";
    bio.textContent = user.bio;
    info.appendChild(bio);
  }

  link.append(avatar, info);
  row.appendChild(link);

  if (user.username !== getUsername()) {
    const followBtn = document.createElement("button");
    setFollowButtonState(followBtn, user.followedByMe);
    followBtn.addEventListener("click", async () => {
      followBtn.disabled = true;
      try {
        const result = await toggleFollow(user.username);
        setFollowButtonState(followBtn, result.followed);
      } catch (err) {
        alert(err.message);
      } finally {
        followBtn.disabled = false;
      }
    });
    row.appendChild(followBtn);
  }

  return row;
}

function setFollowButtonState(btnEl, followed) {
  btnEl.className = "user-row-follow-btn" + (followed ? " following" : "");
  btnEl.textContent = followed ? "フォロー中" : "フォローする";
}
