// 複数のテストファイルで重複していた投稿/ユーザーのサンプルデータ生成をまとめたビルダー。

export function samplePost(id, overrides = {}) {
  return {
    id,
    username: "taro",
    displayName: "太郎",
    createdAt: "2026-01-01T09:00:00",
    body: `投稿${id}`,
    likeCount: 0,
    likedByMe: false,
    mine: false,
    edited: false,
    ...overrides,
  };
}

export function sampleUser(username, overrides = {}) {
  return {
    username,
    displayName: `表示_${username}`,
    bio: null,
    followedByMe: false,
    ...overrides,
  };
}
