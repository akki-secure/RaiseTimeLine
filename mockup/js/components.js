// components.js
// 認証後の共通シェル（サイドナビ・ヘッダー・投稿カード・ユーザー行など）を組み立てる部品群。

function shellTemplate({ active, headerTitle, showBack = false, rightHtml = "" }) {
  const me = Session.getCurrentUser();
  const navItem = (key, icon, label, path) => `
    <div class="nav-link ${active === key ? "active" : ""}" data-nav="${path}">
      <span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>
    </div>`;

  return `
  <div class="app-shell">
    <nav class="side-nav">
      <div class="side-logo">🐦</div>
      ${navItem("timeline", "🏠", "タイムライン", "/timeline")}
      ${navItem("search", "🔍", "検索", "/search")}
      ${navItem("mypage", "👤", "マイページ", `/u/${me ? me.username : ""}`)}
      <div class="nav-user" data-nav="/u/${me ? me.username : ""}">
        ${avatarHtml(me, "sm")}
        <div class="nav-user-info">
          <div class="nav-user-name">${escapeHtml(me ? me.displayName : "")}</div>
          <div class="nav-user-handle">@${escapeHtml(me ? me.username : "")}</div>
        </div>
        <button class="logout-btn" id="logoutBtn" type="button">ログアウト</button>
      </div>
    </nav>
    <main class="main-col">
      <header class="main-header">
        ${showBack ? '<button class="back-btn" id="backBtn" type="button">←</button>' : ""}
        <h2>${headerTitle}</h2>
      </header>
      <div id="mainContent"></div>
    </main>
    <aside class="right-col">
      <div class="search-box" id="headerSearchBox">
        <span>🔍</span>
        <input type="text" placeholder="ユーザーを検索" id="headerSearchInput" readonly>
      </div>
      ${rightHtml}
    </aside>
  </div>
  <nav class="mobile-nav">
    <div class="mobile-nav-link ${active === "timeline" ? "active" : ""}" data-nav="/timeline">🏠</div>
    <div class="mobile-nav-link ${active === "search" ? "active" : ""}" data-nav="/search">🔍</div>
    <div class="mobile-nav-link ${active === "mypage" ? "active" : ""}" data-nav="/u/${
    me ? me.username : ""
  }">👤</div>
  </nav>`;
}

function mountShell({ active, headerTitle, showBack = false, rightHtml = "" }) {
  const app = document.getElementById("app");
  app.innerHTML = shellTemplate({ active, headerTitle, showBack, rightHtml });

  app.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => navigate(el.getAttribute("data-nav")));
  });
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      Session.logout();
      navigate("/login");
    });
  }
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => history.back());
  }
  const headerSearchBox = document.getElementById("headerSearchBox");
  if (headerSearchBox) {
    headerSearchBox.addEventListener("click", () => navigate("/search"));
  }

  return document.getElementById("mainContent");
}

function suggestionsHtml() {
  const me = Session.getCurrentUser();
  if (!me) return "";
  const others = Repo.getUsers().filter((u) => u.id !== me.id).slice(0, 3);
  if (others.length === 0) return "";
  const rows = others
    .map((u) => {
      const following = Repo.isFollowing(me.id, u.id);
      return `
      <div class="user-row" style="padding:8px 0;border:none;" data-goto-user="${u.username}">
        ${avatarHtml(u, "sm")}
        <div class="user-row-info">
          <div class="user-row-name">${escapeHtml(u.displayName)}</div>
          <div class="user-row-username">@${escapeHtml(u.username)}</div>
        </div>
        <button type="button" class="btn btn-sm ${following ? "btn-following" : "btn-primary"}" data-follow-toggle="${u.id}">
          ${following ? "フォロー中" : "フォローする"}
        </button>
      </div>`;
    })
    .join("");
  return `<div class="suggest-card"><h3>おすすめユーザー</h3>${rows}</div>`;
}

function attachSuggestionEvents(container) {
  container.querySelectorAll("[data-follow-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const me = Session.getCurrentUser();
      const targetId = Number(btn.getAttribute("data-follow-toggle"));
      Repo.toggleFollow(me.id, targetId);
      handleRoute();
    });
  });
  container.querySelectorAll("[data-goto-user]").forEach((row) => {
    row.addEventListener("click", () => navigate(`/u/${row.getAttribute("data-goto-user")}`));
  });
}

function postCardHtml(post, { detailMode = false } = {}) {
  const me = Session.getCurrentUser();
  const author = Repo.getUserById(post.userId);
  if (!author) return "";
  const liked = Repo.isLikedBy(post.id, me.id);
  const likeCount = Repo.getLikeCount(post.id);
  const commentCount = Repo.getCommentCount(post.id);
  const isMine = author.id === me.id;
  const edited = post.updatedAt && post.updatedAt !== post.createdAt;

  const menu = isMine
    ? `<div class="post-actions-menu">
        <button type="button" class="post-menu-btn" data-menu-toggle="${post.id}">⋯</button>
        <div class="post-menu-dropdown" id="menu-${post.id}" style="display:none;">
          <button type="button" data-edit-post="${post.id}">編集する</button>
          <button type="button" class="danger" data-delete-post="${post.id}">削除する</button>
        </div>
      </div>`
    : "";

  if (detailMode) {
    return `
    <article class="post-detail-main" data-post-id="${post.id}">
      <div class="post-detail-head">
        ${avatarHtml(author)}
        <div class="post-detail-name" data-goto-user="${author.username}" style="cursor:pointer;">
          <span class="display-name">${escapeHtml(author.displayName)}</span>
          <span class="username">@${escapeHtml(author.username)}</span>
        </div>
        ${menu}
      </div>
      <div class="post-detail-text" data-post-text>${escapeHtml(post.body)}</div>
      ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}" alt="添付画像">` : ""}
      <div class="post-detail-time">${formatDateTime(post.createdAt)}${
      edited ? " ・ 編集済み" : ""
    }</div>
      <div class="post-detail-stats">
        <button type="button" class="stat-btn like-btn ${liked ? "liked" : ""}" data-like-toggle="${post.id}">
          ${liked ? "❤️" : "🤍"} <span data-like-count>${likeCount}</span>件のいいね
        </button>
        <span class="stat-btn" style="cursor:default;">💬 <span data-comment-count>${commentCount}</span>件のコメント</span>
      </div>
    </article>`;
  }

  return `
  <article class="post" data-post-id="${post.id}" data-goto-post="${post.id}">
    ${avatarHtml(author)}
    <div class="post-body-col">
      <div class="post-meta">
        <span class="display-name" data-goto-user="${author.username}">${escapeHtml(
    author.displayName
  )}</span>
        <span class="username">@${escapeHtml(author.username)}</span>
        <span class="time">・${formatDateTime(post.createdAt)}</span>
        ${edited ? '<span class="post-edited-badge">（編集済み）</span>' : ""}
        ${menu}
      </div>
      <div class="post-text">${escapeHtml(post.body)}</div>
      ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}" alt="添付画像">` : ""}
      <div class="post-stats">
        <span class="stat-btn comment-btn" style="cursor:pointer;">💬 ${commentCount}</span>
        <button type="button" class="stat-btn like-btn ${liked ? "liked" : ""}" data-like-toggle="${post.id}">
          ${liked ? "❤️" : "🤍"} ${likeCount}
        </button>
      </div>
    </div>
  </article>`;
}

function attachPostCardEvents(container, { onChange } = {}) {
  container.querySelectorAll("[data-like-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const me = Session.getCurrentUser();
      const postId = btn.getAttribute("data-like-toggle");
      Repo.toggleLike(postId, me.id);
      if (onChange) onChange();
    });
  });
  container.querySelectorAll("[data-goto-post]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-goto-user]") || e.target.closest(".post-actions-menu")) return;
      navigate(`/post/${el.getAttribute("data-goto-post")}`);
    });
  });
  container.querySelectorAll("[data-goto-user]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      navigate(`/u/${el.getAttribute("data-goto-user")}`);
    });
  });
  container.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById(`menu-${btn.getAttribute("data-menu-toggle")}`);
      const isOpen = dropdown.style.display === "block";
      container.querySelectorAll(".post-menu-dropdown").forEach((d) => (d.style.display = "none"));
      dropdown.style.display = isOpen ? "none" : "block";
    });
  });
  container.querySelectorAll("[data-delete-post]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm("この投稿を削除しますか？関連するコメント・いいねも削除されます。")) return;
      Repo.deletePost(btn.getAttribute("data-delete-post"));
      showToast("投稿を削除しました");
      if (onChange) onChange();
      else navigate("/timeline");
    });
  });
  container.querySelectorAll("[data-edit-post]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      startPostEdit(btn.getAttribute("data-edit-post"), container, onChange);
    });
  });

  document.addEventListener(
    "click",
    () => container.querySelectorAll(".post-menu-dropdown").forEach((d) => (d.style.display = "none")),
    { once: true }
  );
}

function startPostEdit(postId, container, onChange) {
  const post = Repo.getPostById(postId);
  const article = container.querySelector(`[data-post-id="${postId}"]`);
  if (!article || !post) return;
  const textEl = article.querySelector(".post-text, [data-post-text]");
  const original = post.body;
  let imageUrl = post.imageUrl;

  textEl.outerHTML = `
    <div class="composer-body" style="padding:0;">
      <textarea maxlength="280" data-edit-textarea style="font-size:15px;">${escapeHtml(
        original
      )}</textarea>
      ${
        imageUrl
          ? `<div class="composer-preview"><img src="${imageUrl}"><button type="button" class="remove-img" data-edit-remove-img>×</button></div>`
          : `<div class="composer-preview" style="display:none;"><img data-edit-preview-img><button type="button" class="remove-img" data-edit-remove-img>×</button></div>`
      }
      <div class="composer-footer">
        <label class="icon-btn" style="cursor:pointer;">🖼️<input type="file" accept="image/*" data-edit-image-input style="display:none;"></label>
        <div>
          <button type="button" class="btn btn-outline btn-sm" data-edit-cancel>キャンセル</button>
          <button type="button" class="btn btn-primary btn-sm" data-edit-save>保存する</button>
        </div>
      </div>
    </div>`;

  const scope = article;
  const textarea = scope.querySelector("[data-edit-textarea]");
  const previewWrap = scope.querySelector(".composer-preview");
  const previewImg = scope.querySelector(".composer-preview img");
  const removeBtn = scope.querySelector("[data-edit-remove-img]");
  const fileInput = scope.querySelector("[data-edit-image-input]");

  fileInput.addEventListener("click", (e) => e.stopPropagation());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imageUrl = reader.result;
      previewImg.src = imageUrl;
      previewWrap.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    imageUrl = null;
    previewWrap.style.display = "none";
  });
  scope.querySelector("[data-edit-cancel]").addEventListener("click", (e) => {
    e.stopPropagation();
    if (onChange) onChange();
  });
  scope.querySelector("[data-edit-save]").addEventListener("click", (e) => {
    e.stopPropagation();
    const body = textarea.value.trim();
    if (!body) {
      showToast("本文を入力してください");
      return;
    }
    if (body.length > 280) {
      showToast("本文は280文字以内で入力してください");
      return;
    }
    Repo.updatePost(postId, body, imageUrl);
    showToast("投稿を更新しました");
    if (onChange) onChange();
  });
}

function userRowHtml(user, { showFollowButton = true } = {}) {
  const me = Session.getCurrentUser();
  const following = Repo.isFollowing(me.id, user.id);
  const isSelf = me.id === user.id;
  return `
  <div class="user-row" data-goto-user="${user.username}">
    ${avatarHtml(user)}
    <div class="user-row-info">
      <div class="user-row-name">${escapeHtml(user.displayName)}</div>
      <div class="user-row-username">@${escapeHtml(user.username)}</div>
      ${user.bio ? `<div class="user-row-bio">${escapeHtml(user.bio)}</div>` : ""}
    </div>
    ${
      showFollowButton && !isSelf
        ? `<button type="button" class="btn btn-sm ${
            following ? "btn-following" : "btn-primary"
          }" data-follow-toggle="${user.id}">${following ? "フォロー中" : "フォローする"}</button>`
        : ""
    }
  </div>`;
}

function attachUserRowEvents(container, { onChange } = {}) {
  container.querySelectorAll("[data-goto-user]").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("[data-follow-toggle]")) return;
      navigate(`/u/${row.getAttribute("data-goto-user")}`);
    });
  });
  container.querySelectorAll("[data-follow-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const me = Session.getCurrentUser();
      Repo.toggleFollow(me.id, btn.getAttribute("data-follow-toggle"));
      if (onChange) onChange();
    });
  });
}
