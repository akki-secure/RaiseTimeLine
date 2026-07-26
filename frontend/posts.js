// RaiseTimeLine 投稿(Post) APIクライアント

async function fetchPosts({ beforeId, afterId, limit } = {}) {
  const params = new URLSearchParams();
  if (beforeId != null) params.set("beforeId", beforeId);
  if (afterId != null) params.set("afterId", afterId);
  if (limit != null) params.set("limit", limit);

  const query = params.toString();
  const res = await authFetch(`/api/posts${query ? `?${query}` : ""}`, { method: "GET" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "投稿の取得に失敗しました"));
  return res.json();
}

async function createPost(body, imageFile) {
  const formData = new FormData();
  formData.set("body", body);
  if (imageFile) formData.set("image", imageFile);

  // Content-Typeヘッダーは明示的に指定しない。FormDataをbodyに渡すとfetchが
  // 境界(boundary)付きのmultipart/form-dataを自動設定するため、手動指定すると
  // 境界情報が欠落しリクエストが壊れる。
  const res = await authFetch("/api/posts", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "投稿に失敗しました"));
  return res.json();
}

async function updatePost(id, body) {
  const res = await authFetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "投稿の編集に失敗しました"));
  return res.json();
}

async function deletePost(id) {
  const res = await authFetch(`/api/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "投稿の削除に失敗しました"));
}
