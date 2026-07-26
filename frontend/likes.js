// RaiseTimeLine いいね APIクライアント

async function toggleLike(postId) {
  const res = await authFetch(`/api/posts/${postId}/likes`, { method: "POST" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "いいねの処理に失敗しました"));
  return res.json();
}
