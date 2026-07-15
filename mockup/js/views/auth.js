// views/auth.js
// ログイン画面・新規登録画面

function renderLogin() {
  const app = document.getElementById("app");
  const users = Repo.getUsers();
  app.innerHTML = `
  <div class="auth-screen">
    <div class="auth-card">
      <div class="auth-logo">🐦 SNSアプリ</div>
      <div id="loginError"></div>
      <form id="loginForm">
        <div class="field">
          <label>メールアドレス</label>
          <input type="email" id="loginEmail" required placeholder="you@example.com">
        </div>
        <div class="field">
          <label>パスワード</label>
          <input type="password" id="loginPassword" required placeholder="8文字以上">
        </div>
        <button type="submit" class="btn btn-primary btn-block">ログイン</button>
      </form>
      <div class="auth-switch">
        アカウントをお持ちでない方は <a href="#/signup">新規登録</a>
      </div>
      <div class="demo-users">
        <div class="demo-users-title">デモ用アカウントでログイン（パスワードは password1）</div>
        <div class="demo-user-list">
          ${users
            .map(
              (u) => `<button type="button" class="btn btn-outline btn-sm" data-demo-login="${u.email}">
              ${u.avatarEmoji} ${escapeHtml(u.displayName)}（@${escapeHtml(u.username)}）としてログイン
            </button>`
            )
            .join("")}
        </div>
      </div>
    </div>
  </div>`;

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    attemptLogin(email, password);
  });

  app.querySelectorAll("[data-demo-login]").forEach((btn) => {
    btn.addEventListener("click", () => attemptLogin(btn.getAttribute("data-demo-login"), "password1"));
  });
}

function attemptLogin(email, password) {
  const user = Repo.getUserByEmail(email);
  const errorEl = document.getElementById("loginError");
  if (!user || user.password !== password) {
    errorEl.innerHTML = `<div class="error-message">メールアドレスまたはパスワードが正しくありません</div>`;
    return;
  }
  Session.login(user.id);
  showToast(`${user.displayName} としてログインしました`);
  navigate("/timeline");
}

function renderSignup() {
  const app = document.getElementById("app");
  app.innerHTML = `
  <div class="auth-screen">
    <div class="auth-card">
      <div class="auth-logo">新規登録</div>
      <div id="signupError"></div>
      <form id="signupForm">
        <div class="field">
          <label>メールアドレス</label>
          <input type="email" id="suEmail" required>
        </div>
        <div class="field">
          <label>パスワード</label>
          <input type="password" id="suPassword" required>
          <div class="field-hint">8文字以上</div>
        </div>
        <div class="field">
          <label>ユーザー名（@から始まる一意な名前）</label>
          <input type="text" id="suUsername" required placeholder="例: taro_yamada">
          <div class="field-hint">英数字と _ のみ、3〜20文字</div>
        </div>
        <div class="field">
          <label>表示名</label>
          <input type="text" id="suDisplayName" required placeholder="例: 山田太郎">
        </div>
        <button type="submit" class="btn btn-primary btn-block">登録する</button>
      </form>
      <div class="auth-switch">
        すでにアカウントをお持ちの方は <a href="#/login">ログイン</a>
      </div>
    </div>
  </div>`;

  document.getElementById("signupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("suEmail").value.trim();
    const password = document.getElementById("suPassword").value;
    const username = document.getElementById("suUsername").value.trim();
    const displayName = document.getElementById("suDisplayName").value.trim();
    const errorEl = document.getElementById("signupError");

    const errors = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("メールアドレスの形式が正しくありません");
    else if (Repo.getUserByEmail(email)) errors.push("そのメールアドレスは既に使用されています");
    if (password.length < 8) errors.push("パスワードは8文字以上で入力してください");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) errors.push("ユーザー名は英数字と_のみ、3〜20文字で入力してください");
    else if (Repo.getUserByUsername(username)) errors.push("そのユーザー名は既に使用されています");
    if (displayName.length < 1 || displayName.length > 50) errors.push("表示名は1〜50文字で入力してください");

    if (errors.length > 0) {
      errorEl.innerHTML = `<div class="error-message">${errors.map(escapeHtml).join("<br>")}</div>`;
      return;
    }

    const user = Repo.createUser({ email, password, username, displayName });
    Session.login(user.id);
    showToast("登録が完了しました");
    navigate("/timeline");
  });
}

registerRoute("/login", renderLogin);
registerRoute("/signup", renderSignup);
