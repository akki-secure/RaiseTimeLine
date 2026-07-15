// views/search.js
// ユーザー検索画面

function renderSearch() {
  const main = mountShell({
    active: "search",
    headerTitle: "ユーザー検索",
    rightHtml: "",
  });

  main.innerHTML = `
    <div class="search-page-box">
      <div class="search-box">
        <span>🔍</span>
        <input type="text" id="searchInput" placeholder="ユーザー名・表示名で検索" autofocus>
      </div>
    </div>
    <div id="searchResults"></div>
  `;

  const me = Session.getCurrentUser();
  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");

  const renderResults = () => {
    const keyword = input.value.trim();
    if (!keyword) {
      resultsEl.innerHTML = `<div class="empty-state">ユーザー名または表示名を入力して検索してください</div>`;
      return;
    }
    const results = Repo.searchUsers(keyword, me.id);
    resultsEl.innerHTML = results.length
      ? results.map((u) => userRowHtml(u)).join("")
      : `<div class="empty-state">「${escapeHtml(keyword)}」に一致するユーザーが見つかりませんでした</div>`;
    attachUserRowEvents(resultsEl, { onChange: renderResults });
  };

  input.addEventListener("input", renderResults);
  renderResults();
}

registerRoute("/search", renderSearch);
