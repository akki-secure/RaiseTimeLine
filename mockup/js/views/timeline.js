// views/timeline.js
// タイムライン画面: 投稿フォーム + 全投稿一覧

let composerImageData = null;

function composerHtml() {
  const me = Session.getCurrentUser();
  return `
  <div class="composer">
    ${avatarHtml(me)}
    <div class="composer-body">
      <textarea id="composerText" maxlength="280" placeholder="いまどうしてる？"></textarea>
      <div class="composer-preview" id="composerPreview" style="display:none;">
        <img id="composerPreviewImg" alt="プレビュー">
        <button type="button" class="remove-img" id="composerRemoveImg">×</button>
      </div>
      <div class="composer-footer">
        <div class="composer-tools">
          <label class="icon-btn" style="cursor:pointer;">🖼️<input type="file" accept="image/*" id="composerImageInput" style="display:none;"></label>
          <span class="char-count" id="composerCharCount">0 / 280</span>
        </div>
        <button type="button" class="btn btn-primary" id="composerSubmit" disabled>投稿</button>
      </div>
    </div>
  </div>`;
}

function attachComposerEvents(onPosted) {
  const textarea = document.getElementById("composerText");
  const submitBtn = document.getElementById("composerSubmit");
  const charCount = document.getElementById("composerCharCount");
  const imageInput = document.getElementById("composerImageInput");
  const preview = document.getElementById("composerPreview");
  const previewImg = document.getElementById("composerPreviewImg");
  const removeImgBtn = document.getElementById("composerRemoveImg");

  composerImageData = null;

  const updateState = () => {
    const len = textarea.value.length;
    charCount.textContent = `${len} / 280`;
    charCount.classList.toggle("over", len > 280);
    submitBtn.disabled = len === 0 || len > 280;
  };

  textarea.addEventListener("input", updateState);
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      composerImageData = reader.result;
      previewImg.src = composerImageData;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
  removeImgBtn.addEventListener("click", () => {
    composerImageData = null;
    preview.style.display = "none";
    imageInput.value = "";
  });

  submitBtn.addEventListener("click", () => {
    const me = Session.getCurrentUser();
    const body = textarea.value.trim();
    if (!body || body.length > 280) return;
    Repo.createPost(me.id, body, composerImageData);
    textarea.value = "";
    composerImageData = null;
    preview.style.display = "none";
    imageInput.value = "";
    updateState();
    showToast("投稿しました");
    if (onPosted) onPosted();
  });

  updateState();
}

function renderTimeline() {
  const main = mountShell({
    active: "timeline",
    headerTitle: "タイムライン",
    rightHtml: suggestionsHtml(),
  });

  const renderList = () => {
    const posts = Repo.getTimelinePosts();
    const listHtml = posts.length
      ? posts.map((p) => postCardHtml(p)).join("")
      : `<div class="empty-state">まだ投稿がありません。最初の投稿をしてみましょう。</div>`;
    main.innerHTML = composerHtml() + `<div id="postList">${listHtml}</div>`;
    attachComposerEvents(renderList);
    attachPostCardEvents(document.getElementById("postList"), { onChange: renderList });
  };

  renderList();
  attachSuggestionEvents(document.querySelector(".right-col"));
}

registerRoute("/timeline", renderTimeline);
