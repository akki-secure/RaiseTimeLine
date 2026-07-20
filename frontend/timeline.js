// RaiseTimeLine タイムライン画面ロジック

if (requireAuth()) {
  document.getElementById("header-username").textContent = getDisplayName() || "ゲスト";

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await logout();
    window.location.href = "login.html";
  });

  const PAGE_SIZE = 20;
  const POLL_INTERVAL_MS = 15000;

  const bodyInput = document.getElementById("post-body");
  const charCount = document.getElementById("char-count");
  const submitBtn = document.getElementById("post-submit-btn");
  const formMessage = document.getElementById("post-form-message");
  const listEl = document.getElementById("post-list");
  const sentinelEl = document.getElementById("scroll-sentinel");
  const modalEl = document.getElementById("new-posts-modal");
  const modalMessageEl = document.getElementById("new-posts-message");
  const modalLoadBtn = document.getElementById("new-posts-load-btn");
  const modalDismissBtn = document.getElementById("new-posts-dismiss-btn");

  let oldestLoadedId = null;
  let newestLoadedId = null;
  let isLoadingMore = false;
  let hasMore = true;
  let pendingNewPosts = [];

  bodyInput.addEventListener("input", () => {
    charCount.textContent = `${bodyInput.value.length}/280`;
  });

  submitBtn.addEventListener("click", async () => {
    const body = bodyInput.value.trim();
    if (!body) return;

    submitBtn.disabled = true;
    try {
      const post = await createPost(body);
      bodyInput.value = "";
      charCount.textContent = "0/280";
      formMessage.className = "";
      formMessage.textContent = "";
      listEl.prepend(buildPostElement(post));
      newestLoadedId = post.id;
      if (oldestLoadedId == null) oldestLoadedId = post.id;
    } catch (err) {
      formMessage.className = "error";
      formMessage.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
    }
  });

  const scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore();
  });
  scrollObserver.observe(sentinelEl);

  modalLoadBtn.addEventListener("click", () => {
    const fragment = document.createDocumentFragment();
    pendingNewPosts.forEach((post) => fragment.appendChild(buildPostElement(post)));
    listEl.insertBefore(fragment, listEl.firstChild);
    newestLoadedId = pendingNewPosts[0].id;
    if (oldestLoadedId == null) oldestLoadedId = pendingNewPosts[pendingNewPosts.length - 1].id;
    pendingNewPosts = [];
    hideNewPostsModal();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  modalDismissBtn.addEventListener("click", () => {
    hideNewPostsModal();
  });

  const pollTimer = setInterval(pollForNewPosts, POLL_INTERVAL_MS);
  window.addEventListener("beforeunload", () => clearInterval(pollTimer));

  loadInitialPosts();

  async function loadInitialPosts() {
    try {
      const posts = await fetchPosts({ limit: PAGE_SIZE });
      listEl.innerHTML = "";
      posts.forEach((post) => listEl.appendChild(buildPostElement(post)));
      newestLoadedId = posts.length > 0 ? posts[0].id : null;
      oldestLoadedId = posts.length > 0 ? posts[posts.length - 1].id : null;
      hasMore = posts.length === PAGE_SIZE;
    } catch (err) {
      listEl.innerHTML = "";
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = err.message;
      listEl.appendChild(errorDiv);
    }
  }

  async function loadMore() {
    if (isLoadingMore || !hasMore || oldestLoadedId == null) return;
    isLoadingMore = true;
    const loadingEl = document.createElement("div");
    loadingEl.className = "loading-more";
    loadingEl.textContent = "読み込み中...";
    listEl.appendChild(loadingEl);

    try {
      const posts = await fetchPosts({ beforeId: oldestLoadedId, limit: PAGE_SIZE });
      posts.forEach((post) => listEl.appendChild(buildPostElement(post)));
      if (posts.length > 0) oldestLoadedId = posts[posts.length - 1].id;
      hasMore = posts.length === PAGE_SIZE;
    } catch (err) {
      // 次のスクロールで再試行できるよう、エラーは無視して読み込み中表示だけ消す
    } finally {
      loadingEl.remove();
      isLoadingMore = false;
    }
  }

  async function pollForNewPosts() {
    if (newestLoadedId == null || pendingNewPosts.length > 0) return;
    try {
      const posts = await fetchPosts({ afterId: newestLoadedId });
      if (posts.length > 0) {
        pendingNewPosts = posts;
        showNewPostsModal(posts.length);
      }
    } catch (err) {
      // ポーリング失敗は次回に任せて無視する
    }
  }

  function showNewPostsModal(count) {
    modalMessageEl.textContent = `${count}件の新着投稿があります`;
    modalEl.classList.remove("hidden");
  }

  function hideNewPostsModal() {
    modalEl.classList.add("hidden");
  }

  function buildPostElement(post) {
    const div = document.createElement("div");
    div.className = "post-item card";
    div.dataset.postId = post.id;

    const header = document.createElement("div");
    header.className = "post-header";

    const avatar = document.createElement("span");
    avatar.className = "post-avatar";
    avatar.textContent = "🧑";

    const author = document.createElement("span");
    author.className = "post-author";
    author.textContent = post.displayName;

    const username = document.createElement("span");
    username.className = "post-username";
    username.textContent = `@${post.username}`;

    const date = document.createElement("span");
    date.className = "post-date";
    date.textContent = formatDate(post.createdAt);

    header.append(avatar, author, username, date);

    if (post.edited) {
      const editedLabel = document.createElement("span");
      editedLabel.className = "edited-label";
      editedLabel.textContent = "（編集済み）";
      header.appendChild(editedLabel);
    }

    const bodyEl = document.createElement("div");
    bodyEl.className = "post-body";
    bodyEl.textContent = post.body;

    div.append(header, bodyEl);

    if (post.mine) {
      const actions = document.createElement("div");
      actions.className = "post-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.textContent = "編集";
      editBtn.addEventListener("click", () => enterEditMode(div, post));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "削除";
      deleteBtn.addEventListener("click", () => handleDelete(post.id, div));

      actions.append(editBtn, deleteBtn);
      div.appendChild(actions);
    }

    return div;
  }

  async function handleDelete(id, el) {
    if (!confirm("この投稿を削除しますか？")) return;
    try {
      await deletePost(id);
      el.remove();
    } catch (err) {
      alert(err.message);
    }
  }

  function enterEditMode(el, post) {
    const bodyEl = el.querySelector(".post-body");
    const actionsEl = el.querySelector(".post-actions");

    bodyEl.innerHTML = "";
    const textarea = document.createElement("textarea");
    textarea.className = "edit-textarea";
    textarea.maxLength = 280;
    textarea.value = post.body;
    bodyEl.appendChild(textarea);

    actionsEl.innerHTML = "";
    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "保存";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.textContent = "キャンセル";

    saveBtn.addEventListener("click", async () => {
      const newBody = textarea.value.trim();
      if (!newBody) return;
      try {
        const updated = await updatePost(post.id, newBody);
        el.replaceWith(buildPostElement(updated));
      } catch (err) {
        alert(err.message);
      }
    });

    cancelBtn.addEventListener("click", () => {
      el.replaceWith(buildPostElement(post));
    });

    actionsEl.append(saveBtn, cancelBtn);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
