// RaiseTimeLine プロフィール画面ロジック

if (requireAuth()) {
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await logout();
    window.location.href = "login.html";
  });

  const PAGE_SIZE = 20;

  const params = new URLSearchParams(window.location.search);
  const username = params.get("username") || "";

  const profileCardEl = document.getElementById("profile-card");
  const profileMessageEl = document.getElementById("profile-message");
  const displayNameEl = document.getElementById("profile-display-name");
  const usernameEl = document.getElementById("profile-username");
  const bioViewEl = document.getElementById("profile-bio-view");
  const editBioBtn = document.getElementById("profile-edit-bio-btn");
  const followBtn = document.getElementById("profile-follow-btn");
  const followingCountEl = document.getElementById("profile-following-count");
  const followersCountEl = document.getElementById("profile-followers-count");
  const followingLinkEl = document.getElementById("profile-following-link");
  const followersLinkEl = document.getElementById("profile-followers-link");
  const listEl = document.getElementById("post-list");
  const loadMoreBtn = document.getElementById("load-more-btn");

  let oldestLoadedId = null;
  let hasMore = true;
  let isLoadingMore = false;

  loadMoreBtn.addEventListener("click", loadMore);

  if (!username) {
    showError("ユーザーが指定されていません");
  } else {
    loadProfile();
    loadInitialPosts();
  }

  async function loadProfile() {
    try {
      const profile = await getUserProfile(username);
      renderProfile(profile);
    } catch (err) {
      showError(err.message);
    }
  }

  function renderProfile(profile) {
    profileCardEl.classList.remove("hidden");
    displayNameEl.textContent = profile.displayName;
    usernameEl.textContent = `@${profile.username}`;
    renderBioView(profile.bio);
    followingCountEl.textContent = profile.followingCount;
    followersCountEl.textContent = profile.followerCount;
    followingLinkEl.href = `follow-list.html?username=${encodeURIComponent(profile.username)}&type=following`;
    followersLinkEl.href = `follow-list.html?username=${encodeURIComponent(profile.username)}&type=followers`;

    if (profile.username === getUsername()) {
      editBioBtn.classList.remove("hidden");
      editBioBtn.onclick = () => enterBioEditMode(profile.bio);
      followBtn.classList.add("hidden");
      followBtn.onclick = null;
    } else {
      editBioBtn.classList.add("hidden");
      editBioBtn.onclick = null;
      followBtn.classList.remove("hidden");
      setFollowButtonState(followBtn, profile.followedByMe);
      followBtn.onclick = async () => {
        followBtn.disabled = true;
        try {
          const result = await toggleFollow(profile.username);
          setFollowButtonState(followBtn, result.followed);
          followersCountEl.textContent = result.followerCount;
        } catch (err) {
          alert(err.message);
        } finally {
          followBtn.disabled = false;
        }
      };
    }
  }

  function renderBioView(bio) {
    bioViewEl.textContent = bio || "";
  }

  function enterBioEditMode(currentBio) {
    bioViewEl.innerHTML = "";
    const textarea = document.createElement("textarea");
    textarea.className = "edit-textarea";
    textarea.maxLength = 160;
    textarea.rows = 2;
    textarea.value = currentBio || "";
    bioViewEl.appendChild(textarea);

    const actions = document.createElement("div");
    actions.className = "profile-bio-actions";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      try {
        const updated = await updateMyBio(textarea.value.trim());
        renderBioView(updated.bio);
      } catch (err) {
        alert(err.message);
      } finally {
        saveBtn.disabled = false;
      }
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "secondary";
    cancelBtn.textContent = "キャンセル";
    cancelBtn.addEventListener("click", () => renderBioView(currentBio));

    actions.append(saveBtn, cancelBtn);
    bioViewEl.appendChild(actions);
  }

  async function loadInitialPosts() {
    try {
      const posts = await fetchUserPosts(username, { limit: PAGE_SIZE });
      listEl.innerHTML = "";
      posts.forEach((post) => listEl.appendChild(buildPostElement(post)));
      oldestLoadedId = posts.length > 0 ? posts[posts.length - 1].id : null;
      hasMore = posts.length === PAGE_SIZE;
      loadMoreBtn.classList.toggle("hidden", !hasMore);
    } catch (err) {
      showError(err.message);
    }
  }

  async function loadMore() {
    if (isLoadingMore || !hasMore || oldestLoadedId == null) return;
    isLoadingMore = true;
    loadMoreBtn.disabled = true;

    try {
      const posts = await fetchUserPosts(username, { beforeId: oldestLoadedId, limit: PAGE_SIZE });
      posts.forEach((post) => listEl.appendChild(buildPostElement(post)));
      if (posts.length > 0) oldestLoadedId = posts[posts.length - 1].id;
      hasMore = posts.length === PAGE_SIZE;
      loadMoreBtn.classList.toggle("hidden", !hasMore);
    } catch (err) {
      alert(err.message);
    } finally {
      isLoadingMore = false;
      loadMoreBtn.disabled = false;
    }
  }

  function showError(message) {
    profileMessageEl.className = "error";
    profileMessageEl.textContent = message;
  }
}
