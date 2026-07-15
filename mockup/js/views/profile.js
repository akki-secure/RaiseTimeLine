// views/profile.js
// マイページ画面 / 他ユーザープロフィール画面 / プロフィール編集画面

function renderProfile({ username }) {
  const user = Repo.getUserByUsername(username);
  const me = Session.getCurrentUser();

  if (!user) {
    const main = mountShell({ active: "", headerTitle: "プロフィール", showBack: true });
    main.innerHTML = `<div class="empty-state">ユーザーが見つかりません</div>`;
    return;
  }

  const isSelf = user.id === me.id;
  const main = mountShell({
    active: isSelf ? "mypage" : "",
    headerTitle: user.displayName,
    showBack: !isSelf,
    rightHtml: suggestionsHtml(),
  });

  const renderAll = () => {
    const following = Repo.isFollowing(me.id, user.id);
    const followingCount = Repo.getFollowingCount(user.id);
    const followerCount = Repo.getFollowerCount(user.id);
    const posts = Repo.getPostsByUser(user.id);

    main.innerHTML = `
      <div class="profile-cover"></div>
      <div class="profile-head">
        ${avatarHtml(user, "lg")}
        <div class="profile-head-actions">
          ${
            isSelf
              ? `<button type="button" class="btn btn-outline" id="editProfileBtn">プロフィールを編集</button>`
              : `<button type="button" class="btn ${
                  following ? "btn-following" : "btn-primary"
                }" id="followToggleBtn">${following ? "フォロー中" : "フォローする"}</button>`
          }
        </div>
        <div class="profile-display-name">${escapeHtml(user.displayName)}</div>
        <div class="profile-username">@${escapeHtml(user.username)}</div>
        ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ""}
        <div class="profile-stats">
          <a data-goto="/u/${user.username}/following"><strong>${followingCount}</strong> フォロー中</a>
          <a data-goto="/u/${user.username}/followers"><strong>${followerCount}</strong> フォロワー</a>
        </div>
      </div>
      <div class="profile-tabs">
        <div class="profile-tab active">ポスト</div>
      </div>
      <div id="profilePostList">
        ${
          posts.length
            ? posts.map((p) => postCardHtml(p)).join("")
            : `<div class="empty-state">まだ投稿がありません</div>`
        }
      </div>
    `;

    if (isSelf) {
      document.getElementById("editProfileBtn").addEventListener("click", () => navigate("/profile/edit"));
    } else {
      document.getElementById("followToggleBtn").addEventListener("click", () => {
        Repo.toggleFollow(me.id, user.id);
        renderAll();
      });
    }

    main.querySelectorAll("[data-goto]").forEach((el) => {
      el.addEventListener("click", () => navigate(el.getAttribute("data-goto")));
    });

    attachPostCardEvents(document.getElementById("profilePostList"), { onChange: renderAll });
  };

  renderAll();
  attachSuggestionEvents(document.querySelector(".right-col"));
}

function renderProfileEdit() {
  const me = Session.getCurrentUser();
  const main = mountShell({ active: "mypage", headerTitle: "プロフィールを編集", showBack: true });

  let avatarData = me.avatarUrl;

  main.innerHTML = `
    <div class="edit-form">
      <div id="editError"></div>
      <div class="edit-avatar-row">
        ${avatarHtml(me, "lg")}
        <label class="btn btn-outline btn-sm" style="cursor:pointer;">
          画像を変更
          <input type="file" accept="image/*" id="avatarInput" style="display:none;">
        </label>
      </div>
      <div class="field">
        <label>表示名</label>
        <input type="text" id="editDisplayName" value="${escapeHtml(me.displayName)}" maxlength="50">
      </div>
      <div class="field">
        <label>自己紹介</label>
        <textarea id="editBio" maxlength="160" rows="3">${escapeHtml(me.bio || "")}</textarea>
        <div class="char-remaining" id="bioCharCount">${(me.bio || "").length} / 160</div>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="saveProfileBtn">保存する</button>
    </div>
  `;

  const avatarPreview = main.querySelector(".avatar.lg");
  document.getElementById("avatarInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      showToast("JPEG / PNG / GIF形式の画像を選択してください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("画像サイズは5MB以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      avatarData = reader.result;
      avatarPreview.innerHTML = `<img src="${avatarData}" alt="プレビュー">`;
    };
    reader.readAsDataURL(file);
  });

  const bioInput = document.getElementById("editBio");
  bioInput.addEventListener("input", () => {
    document.getElementById("bioCharCount").textContent = `${bioInput.value.length} / 160`;
  });

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    const displayName = document.getElementById("editDisplayName").value.trim();
    const bio = bioInput.value.trim();
    const errorEl = document.getElementById("editError");
    const errors = [];
    if (displayName.length < 1 || displayName.length > 50) errors.push("表示名は1〜50文字で入力してください");
    if (bio.length > 160) errors.push("自己紹介は160文字以内で入力してください");
    if (errors.length > 0) {
      errorEl.innerHTML = `<div class="error-message">${errors.map(escapeHtml).join("<br>")}</div>`;
      return;
    }
    Repo.updateUserProfile(me.id, { displayName, bio: bio || null, avatarUrl: avatarData });
    showToast("プロフィールを更新しました");
    navigate(`/u/${me.username}`);
  });
}

registerRoute("/u/:username", renderProfile);
registerRoute("/profile/edit", renderProfileEdit);
