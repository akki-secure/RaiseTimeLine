// RaiseTimeLine タイムライン画面ロジック

if (requireAuth()) {
  const headerUsernameEl = document.getElementById("header-username");
  headerUsernameEl.textContent = getDisplayName() || "ゲスト";
  headerUsernameEl.href = `profile.html?username=${encodeURIComponent(getUsername() || "")}`;

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
  const imageInput = document.getElementById("post-image-input");
  const imagePreview = document.getElementById("post-image-preview");
  const imageRemoveBtn = document.getElementById("post-image-remove-btn");
  const searchInput = document.getElementById("user-search-input");
  const searchResultsEl = document.getElementById("user-search-results");
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
  let selectedImageFile = null;
  let searchDebounceTimer = null;

  bodyInput.addEventListener("input", () => {
    charCount.textContent = `${bodyInput.value.length}/280`;
  });

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.classList.remove("hidden");
    imageRemoveBtn.classList.remove("hidden");
  });

  imageRemoveBtn.addEventListener("click", () => {
    resetImageInput();
  });

  function resetImageInput() {
    selectedImageFile = null;
    imageInput.value = "";
    imagePreview.src = "";
    imagePreview.classList.add("hidden");
    imageRemoveBtn.classList.add("hidden");
  }

  submitBtn.addEventListener("click", async () => {
    const body = bodyInput.value.trim();
    if (!body) return;

    submitBtn.disabled = true;
    try {
      const post = await createPost(body, selectedImageFile);
      bodyInput.value = "";
      charCount.textContent = "0/280";
      resetImageInput();
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

  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    const keyword = searchInput.value.trim();
    if (!keyword) {
      searchResultsEl.classList.add("hidden");
      searchResultsEl.innerHTML = "";
      return;
    }
    searchDebounceTimer = setTimeout(() => runUserSearch(keyword), 300);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-search")) {
      searchResultsEl.classList.add("hidden");
    }
  });

  async function runUserSearch(keyword) {
    try {
      const users = await searchUsers(keyword);
      // デバウンス中に入力が変わっている場合、古いレスポンスの描画をスキップする
      if (searchInput.value.trim() !== keyword) return;
      renderUserSearchResults(users);
    } catch (err) {
      if (searchInput.value.trim() !== keyword) return;
      searchResultsEl.innerHTML = "";
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = err.message;
      searchResultsEl.appendChild(errorDiv);
      searchResultsEl.classList.remove("hidden");
    }
  }

  function renderUserSearchResults(users) {
    searchResultsEl.innerHTML = "";
    if (users.length === 0) {
      const empty = document.createElement("div");
      empty.className = "user-search-empty";
      empty.textContent = "該当するユーザーが見つかりません";
      searchResultsEl.appendChild(empty);
    } else {
      users.forEach((u) => searchResultsEl.appendChild(buildUserSearchResultElement(u)));
    }
    searchResultsEl.classList.remove("hidden");
  }

  function buildUserSearchResultElement(user) {
    const a = document.createElement("a");
    a.className = "user-search-result-item";
    a.href = `profile.html?username=${encodeURIComponent(user.username)}`;
    const name = document.createElement("span");
    name.className = "result-display-name";
    name.textContent = user.displayName;
    const username = document.createElement("span");
    username.className = "result-username";
    username.textContent = `@${user.username}`;
    a.append(name, username);
    return a;
  }

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
}
