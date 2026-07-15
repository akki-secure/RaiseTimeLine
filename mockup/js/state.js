// state.js
// ログイン中ユーザーIDなどのセッション状態を管理する。

const SESSION_KEY = "raisetimeline_mock_session_v1";

const Session = {
  getCurrentUserId() {
    const v = localStorage.getItem(SESSION_KEY);
    return v ? Number(v) : null;
  },
  getCurrentUser() {
    const id = this.getCurrentUserId();
    return id ? Repo.getUserById(id) : null;
  },
  login(userId) {
    localStorage.setItem(SESSION_KEY, String(userId));
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
  isLoggedIn() {
    return this.getCurrentUserId() !== null;
  },
};

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function avatarHtml(user, size = "") {
  const cls = size ? `avatar ${size}` : "avatar";
  if (user && user.avatarUrl) {
    return `<div class="${cls}"><img src="${user.avatarUrl}" alt="${escapeHtml(
      user.displayName
    )}"></div>`;
  }
  const emoji = (user && user.avatarEmoji) || "🧑";
  return `<div class="${cls}">${emoji}</div>`;
}
