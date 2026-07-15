// views/postDetail.js
// 投稿詳細画面: 本文全体 + コメント一覧 + コメント投稿フォーム

function commentHtml(comment) {
  const me = Session.getCurrentUser();
  const author = Repo.getUserById(comment.userId);
  if (!author) return "";
  const isMine = author.id === me.id;
  return `
  <div class="comment" data-comment-id="${comment.id}">
    ${avatarHtml(author, "sm")}
    <div class="comment-body-col">
      <div class="comment-meta">
        <span class="display-name" data-goto-user="${author.username}">${escapeHtml(
    author.displayName
  )}</span>
        <span class="username">@${escapeHtml(author.username)}</span>
        <span class="time">・${formatDateTime(comment.createdAt)}</span>
        ${isMine ? `<button type="button" class="comment-delete" data-delete-comment="${comment.id}">削除</button>` : ""}
      </div>
      <div class="comment-text">${escapeHtml(comment.body)}</div>
    </div>
  </div>`;
}

function renderPostDetail({ id }) {
  const post = Repo.getPostById(id);
  if (!post) {
    navigate("/timeline");
    return;
  }

  const main = mountShell({
    active: "",
    headerTitle: "投稿",
    showBack: true,
    rightHtml: suggestionsHtml(),
  });

  const renderAll = () => {
    const current = Repo.getPostById(id);
    if (!current) {
      navigate("/timeline");
      return;
    }
    const comments = Repo.getCommentsByPost(id);
    const me = Session.getCurrentUser();
    main.innerHTML = `
      <div id="postDetailWrap">${postCardHtml(current, { detailMode: true })}</div>
      <div class="comment-form">
        ${avatarHtml(me, "sm")}
        <div class="comment-form-body">
          <textarea id="commentText" maxlength="140" placeholder="返信をポスト"></textarea>
          <div class="comment-form-footer">
            <span class="char-count" id="commentCharCount">0 / 140</span>
            <button type="button" class="btn btn-primary btn-sm" id="commentSubmit" disabled>送信</button>
          </div>
        </div>
      </div>
      <div id="commentList">
        ${
          comments.length
            ? comments.map(commentHtml).join("")
            : `<div class="empty-state">まだコメントがありません。最初のコメントをしてみましょう。</div>`
        }
      </div>
    `;

    attachPostCardEvents(document.getElementById("postDetailWrap"), { onChange: renderAll });

    const textarea = document.getElementById("commentText");
    const submitBtn = document.getElementById("commentSubmit");
    const charCount = document.getElementById("commentCharCount");
    textarea.addEventListener("input", () => {
      const len = textarea.value.length;
      charCount.textContent = `${len} / 140`;
      charCount.classList.toggle("over", len > 140);
      submitBtn.disabled = len === 0 || len > 140;
    });
    submitBtn.addEventListener("click", () => {
      const body = textarea.value.trim();
      if (!body || body.length > 140) return;
      Repo.createComment(id, me.id, body);
      showToast("コメントしました");
      renderAll();
    });

    const commentList = document.getElementById("commentList");
    commentList.querySelectorAll("[data-goto-user]").forEach((el) => {
      el.addEventListener("click", () => navigate(`/u/${el.getAttribute("data-goto-user")}`));
    });
    commentList.querySelectorAll("[data-delete-comment]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("このコメントを削除しますか？")) return;
        Repo.deleteComment(btn.getAttribute("data-delete-comment"));
        showToast("コメントを削除しました");
        renderAll();
      });
    });
  };

  renderAll();
  attachSuggestionEvents(document.querySelector(".right-col"));
}

registerRoute("/post/:id", renderPostDetail);
