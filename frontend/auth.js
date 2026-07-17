// RaiseTimeLine 認証共通ヘルパー
// アクセストークン/リフレッシュトークンの保存・自動リフレッシュ付きfetchを提供する。
const API_BASE = "http://localhost:8080";

function saveTokens(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("displayName", data.displayName || data.username || "");
}

function clearTokens() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("displayName");
}

function getAccessToken() {
  return localStorage.getItem("token");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function getDisplayName() {
  return localStorage.getItem("displayName");
}

// ログイン必須ページの先頭で呼ぶ。未ログインならlogin.htmlへ追い返してfalseを返す。
// 呼び出し側はtrueが返った場合のみページ固有の処理を実行すること
// （リダイレクトはページ遷移が完了するまで後続のスクリプト実行を止めないため）。
function requireAuth() {
  if (!getAccessToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const data = await res.json();
  saveTokens(data);
  return true;
}

// 保護APIを叩く際はこの関数を使う。アクセストークン切れ(401)を検知したら
// 一度だけ自動リフレッシュしてリクエストをリトライする。
async function authFetch(path, options = {}) {
  const doFetch = () => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${getAccessToken()}`,
    };
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doFetch();
    }
  }

  return res;
}

async function logout() {
  const refreshToken = getRefreshToken();
  clearTokens();
  if (!refreshToken) return;

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    // ネットワーク不通でもクライアント側のトークンは既に破棄済みなので無視してよい
  }
}

// サーバーの{"message": "..."}形式のエラーレスポンスからメッセージを取り出す。
// GlobalExceptionHandlerが返す形式に合わせている。
async function extractErrorMessage(res, fallback) {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

// メールアドレス/パスワードでログインし、成功時はトークンを保存してレスポンスを返す。
async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, `ログインに失敗しました（status: ${res.status}）`));
  }

  const data = await res.json();
  saveTokens(data);
  return data;
}

// 新規登録し、成功時はトークンを保存してレスポンスを返す（登録即ログイン）。
async function register(email, password, username, displayName) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username, displayName }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, `登録に失敗しました（status: ${res.status}）`));
  }

  const data = await res.json();
  saveTokens(data);
  return data;
}
