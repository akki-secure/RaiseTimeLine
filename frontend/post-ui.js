// RaiseTimeLine 投稿カードの共通UI構築ロジック
// timeline.js / profile.js の両方から呼ばれる。

function buildPostElement(post) {
  const div = document.createElement("div");
  div.className = "post-item card";
  div.dataset.postId = post.id;

  const header = document.createElement("div");
  header.className = "post-header";

  const avatar = document.createElement("span");
  avatar.className = "post-avatar";
  avatar.textContent = "🧑";

  const author = document.createElement("a");
  author.className = "post-author";
  author.href = `profile.html?username=${encodeURIComponent(post.username)}`;
  author.textContent = post.displayName;

  const username = document.createElement("a");
  username.className = "post-username";
  username.href = `profile.html?username=${encodeURIComponent(post.username)}`;
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

  if (post.imageUrl) {
    const img = document.createElement("img");
    img.className = "post-image";
    img.src = `${API_BASE}${post.imageUrl}`;
    img.alt = "添付画像";
    div.appendChild(img);
  }

  const footer = document.createElement("div");
  footer.className = "post-footer";

  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn" + (post.likedByMe ? " liked" : "");
  likeBtn.textContent = `${post.likedByMe ? "❤️" : "🤍"} ${post.likeCount}`;
  likeBtn.addEventListener("click", () => handleToggleLike(post.id, likeBtn));

  const commentToggleBtn = document.createElement("button");
  commentToggleBtn.className = "comment-toggle-btn";
  commentToggleBtn.textContent = "💬 コメント";
  commentToggleBtn.addEventListener("click", () => toggleCommentsPanel(div, post.id));

  footer.append(likeBtn, commentToggleBtn);
  div.appendChild(footer);

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

async function handleToggleLike(postId, btnEl) {
  btnEl.disabled = true;
  try {
    const result = await toggleLike(postId);
    btnEl.className = "like-btn" + (result.liked ? " liked" : "");
    btnEl.textContent = `${result.liked ? "❤️" : "🤍"} ${result.likeCount}`;
  } catch (err) {
    alert(err.message);
  } finally {
    btnEl.disabled = false;
  }
}

function toggleCommentsPanel(postDiv, postId) {
  let panel = postDiv.querySelector(".comments-panel");
  if (panel) {
    panel.classList.toggle("hidden");
    return;
  }

  panel = document.createElement("div");
  panel.className = "comments-panel";

  const listEl = document.createElement("div");
  listEl.className = "comments-list";
  panel.appendChild(listEl);
  attachCommentForm(panel, postId);
  postDiv.appendChild(panel);

  fetchComments(postId)
    .then((comments) => {
      comments.forEach((comment) => listEl.appendChild(buildCommentElement(comment, postId)));
    })
    .catch((err) => {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = err.message;
      listEl.appendChild(errorDiv);
    });
}

function attachCommentForm(panelEl, postId) {
  const form = document.createElement("div");
  form.className = "comment-form";

  const textarea = document.createElement("textarea");
  textarea.maxLength = 280;
  textarea.rows = 2;
  textarea.placeholder = "コメントを追加...";

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "送信";
  submitBtn.addEventListener("click", async () => {
    const body = textarea.value.trim();
    if (!body) return;
    submitBtn.disabled = true;
    try {
      const comment = await createComment(postId, body);
      const listEl = panelEl.querySelector(".comments-list");
      listEl.appendChild(buildCommentElement(comment, postId));
      textarea.value = "";
    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

  form.append(textarea, submitBtn);
  panelEl.appendChild(form);
}

function buildCommentElement(comment, postId) {
  const div = document.createElement("div");
  div.className = "comment-item";
  div.dataset.commentId = comment.id;

  const header = document.createElement("div");
  header.className = "comment-header";

  const author = document.createElement("span");
  author.className = "comment-author";
  author.textContent = comment.displayName;

  const username = document.createElement("span");
  username.className = "comment-username";
  username.textContent = `@${comment.username}`;

  const date = document.createElement("span");
  date.className = "comment-date";
  date.textContent = formatDate(comment.createdAt);

  header.append(author, username, date);

  if (comment.edited) {
    const editedLabel = document.createElement("span");
    editedLabel.className = "edited-label";
    editedLabel.textContent = "（編集済み）";
    header.appendChild(editedLabel);
  }

  const bodyEl = document.createElement("div");
  bodyEl.className = "comment-body";
  bodyEl.textContent = comment.body;

  div.append(header, bodyEl);

  if (comment.mine) {
    const actions = document.createElement("div");
    actions.className = "comment-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => enterCommentEditMode(div, postId, comment));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => handleCommentDelete(postId, comment.id, div));

    actions.append(editBtn, deleteBtn);
    div.appendChild(actions);
  }

  return div;
}

async function handleCommentDelete(postId, commentId, el) {
  if (!confirm("このコメントを削除しますか？")) return;
  try {
    await deleteComment(postId, commentId);
    el.remove();
  } catch (err) {
    alert(err.message);
  }
}

function enterCommentEditMode(el, postId, comment) {
  const bodyEl = el.querySelector(".comment-body");
  const actionsEl = el.querySelector(".comment-actions");

  bodyEl.innerHTML = "";
  const textarea = document.createElement("textarea");
  textarea.className = "edit-textarea";
  textarea.maxLength = 280;
  textarea.value = comment.body;
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
      const updated = await updateComment(postId, comment.id, newBody);
      el.replaceWith(buildCommentElement(updated, postId));
    } catch (err) {
      alert(err.message);
    }
  });

  cancelBtn.addEventListener("click", () => {
    el.replaceWith(buildCommentElement(comment, postId));
  });

  actionsEl.append(saveBtn, cancelBtn);
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
