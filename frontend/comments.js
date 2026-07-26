// RaiseTimeLine コメント APIクライアント

async function fetchComments(postId) {
  const res = await authFetch(`/api/posts/${postId}/comments`, { method: "GET" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "コメントの取得に失敗しました"));
  return res.json();
}

async function createComment(postId, body) {
  const res = await authFetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "コメントの投稿に失敗しました"));
  return res.json();
}

async function updateComment(postId, commentId, body) {
  const res = await authFetch(`/api/posts/${postId}/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "コメントの編集に失敗しました"));
  return res.json();
}

async function deleteComment(postId, commentId) {
  const res = await authFetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "コメントの削除に失敗しました"));
}
