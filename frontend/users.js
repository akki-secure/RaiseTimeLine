// RaiseTimeLine ユーザー検索 APIクライアント

async function searchUsers(q) {
  const params = new URLSearchParams({ q });
  const res = await authFetch(`/api/users/search?${params.toString()}`, { method: "GET" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "ユーザー検索に失敗しました"));
  return res.json();
}

async function getUserProfile(username) {
  const res = await authFetch(`/api/users/${encodeURIComponent(username)}`, { method: "GET" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "ユーザー情報の取得に失敗しました"));
  return res.json();
}

async function fetchUserPosts(username, { beforeId, limit } = {}) {
  const params = new URLSearchParams();
  if (beforeId != null) params.set("beforeId", beforeId);
  if (limit != null) params.set("limit", limit);

  const query = params.toString();
  const res = await authFetch(
    `/api/users/${encodeURIComponent(username)}/posts${query ? `?${query}` : ""}`,
    { method: "GET" }
  );
  if (!res.ok) throw new Error(await extractErrorMessage(res, "投稿の取得に失敗しました"));
  return res.json();
}

async function updateMyBio(bio) {
  const res = await authFetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bio }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "自己紹介の更新に失敗しました"));
  return res.json();
}
