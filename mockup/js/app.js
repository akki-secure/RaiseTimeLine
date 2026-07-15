// app.js
// エントリーポイント: 初期ルート判定してルーティングを開始する。

document.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) {
    location.hash = Session.isLoggedIn() ? "#/timeline" : "#/login";
  }
  handleRoute();
});
