// data.js
// localStorage を DB 代わりに使うフェイクリポジトリ層。
// テーブル定義は docs/er.md に準拠（users / posts / comments / likes / follows）。

const STORAGE_KEY = "raisetimeline_mock_db_v1";

const AVATAR_EMOJIS = ["🐱", "🦊", "🐼", "🐸", "🐨", "🦁", "🐯", "🐹"];

function nowIso(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  return d.toISOString();
}

function buildSeed() {
  const users = [
    {
      id: 1,
      email: "alice@example.com",
      password: "password1",
      username: "alice",
      displayName: "アリス",
      bio: "デザイン系エンジニア。猫が好き。",
      avatarUrl: null,
      avatarEmoji: "🐱",
      createdAt: nowIso(-60 * 24 * 30),
    },
    {
      id: 2,
      email: "bob@example.com",
      password: "password1",
      username: "bob",
      displayName: "ボブ",
      bio: "バックエンドエンジニア / Spring Boot 修行中",
      avatarUrl: null,
      avatarEmoji: "🦊",
      createdAt: nowIso(-60 * 24 * 20),
    },
    {
      id: 3,
      email: "carol@example.com",
      password: "password1",
      username: "carol",
      displayName: "キャロル",
      bio: null,
      avatarUrl: null,
      avatarEmoji: "🐼",
      createdAt: nowIso(-60 * 24 * 10),
    },
    {
      id: 4,
      email: "dai@example.com",
      password: "password1",
      username: "dai_dev",
      displayName: "ダイ",
      bio: "学習用にSNSアプリを作っています🔥",
      avatarUrl: null,
      avatarEmoji: "🐸",
      createdAt: nowIso(-60 * 24 * 5),
    },
  ];

  const posts = [
    {
      id: 1,
      userId: 1,
      body: "今日からタイムラインアプリのプロトタイプ作り始めました！よろしくお願いします🙌",
      imageUrl: null,
      createdAt: nowIso(-120),
      updatedAt: nowIso(-120),
    },
    {
      id: 2,
      userId: 2,
      body: "Spring Boot + JWT認証の実装、意外とハマりどころが多い…でも楽しい。",
      imageUrl: null,
      createdAt: nowIso(-90),
      updatedAt: nowIso(-90),
    },
    {
      id: 3,
      userId: 3,
      body: "在庫していたコーヒー豆を消費中。",
      imageUrl:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="%234b3621"/><text x="50%" y="50%" font-size="28" fill="white" text-anchor="middle" dominant-baseline="middle">☕ coffee time</text></svg>'
        ),
      createdAt: nowIso(-60),
      updatedAt: nowIso(-60),
    },
    {
      id: 4,
      userId: 4,
      body: "E-R図の設計が固まってきた。likes/follows のユニーク制約大事。",
      imageUrl: null,
      createdAt: nowIso(-30),
      updatedAt: nowIso(-30),
    },
    {
      id: 5,
      userId: 1,
      body: "画像添付機能もモックで再現してみた。実際はS3に保存する予定。",
      imageUrl:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="%231d9bf0"/><text x="50%" y="50%" font-size="28" fill="white" text-anchor="middle" dominant-baseline="middle">📷 sample image</text></svg>'
        ),
      createdAt: nowIso(-10),
      updatedAt: nowIso(-10),
    },
  ];

  const comments = [
    { id: 1, postId: 1, userId: 2, body: "楽しみにしてます！", createdAt: nowIso(-100) },
    { id: 2, postId: 1, userId: 3, body: "いいですね〜応援してます", createdAt: nowIso(-95) },
    { id: 3, postId: 3, userId: 4, body: "美味しそう☕", createdAt: nowIso(-55) },
  ];

  const likes = [
    { id: 1, postId: 1, userId: 2, createdAt: nowIso(-99) },
    { id: 2, postId: 1, userId: 3, createdAt: nowIso(-98) },
    { id: 3, postId: 1, userId: 4, createdAt: nowIso(-97) },
    { id: 4, postId: 3, userId: 1, createdAt: nowIso(-50) },
    { id: 5, postId: 4, userId: 1, createdAt: nowIso(-20) },
    { id: 6, postId: 4, userId: 2, createdAt: nowIso(-19) },
  ];

  const follows = [
    { id: 1, followerId: 1, followedId: 2, createdAt: nowIso(-60 * 24 * 3) },
    { id: 2, followerId: 1, followedId: 3, createdAt: nowIso(-60 * 24 * 2) },
    { id: 3, followerId: 2, followedId: 1, createdAt: nowIso(-60 * 24 * 3) },
    { id: 4, followerId: 3, followedId: 1, createdAt: nowIso(-60 * 24 * 1) },
    { id: 5, followerId: 4, followedId: 1, createdAt: nowIso(-60 * 12) },
    { id: 6, followerId: 4, followedId: 2, createdAt: nowIso(-60 * 10) },
  ];

  return {
    users,
    posts,
    comments,
    likes,
    follows,
    nextIds: { users: 5, posts: 6, comments: 4, likes: 7, follows: 7 },
  };
}

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = buildSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const seed = buildSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

let db = loadDb();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(kind) {
  const id = db.nextIds[kind];
  db.nextIds[kind] += 1;
  return id;
}

const Repo = {
  resetToSeed() {
    db = buildSeed();
    save();
  },

  // ---------- users ----------
  getUsers() {
    return db.users.slice();
  },
  getUserById(id) {
    return db.users.find((u) => u.id === Number(id)) || null;
  },
  getUserByUsername(username) {
    return db.users.find((u) => u.username === username) || null;
  },
  getUserByEmail(email) {
    return db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
  },
  createUser({ email, password, username, displayName }) {
    const user = {
      id: nextId("users"),
      email,
      password,
      username,
      displayName,
      bio: null,
      avatarUrl: null,
      avatarEmoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
      createdAt: nowIso(),
    };
    db.users.push(user);
    save();
    return user;
  },
  updateUserProfile(userId, { displayName, bio, avatarUrl }) {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.displayName = displayName;
    user.bio = bio;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    save();
    return user;
  },
  searchUsers(keyword, excludeUserId) {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    return db.users.filter(
      (u) =>
        u.id !== Number(excludeUserId) &&
        (u.username.toLowerCase().includes(kw) || u.displayName.toLowerCase().includes(kw))
    );
  },

  // ---------- posts ----------
  getTimelinePosts() {
    return db.posts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  getPostsByUser(userId) {
    return db.posts
      .filter((p) => p.userId === Number(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  getPostById(id) {
    return db.posts.find((p) => p.id === Number(id)) || null;
  },
  createPost(userId, body, imageUrl) {
    const post = {
      id: nextId("posts"),
      userId: Number(userId),
      body,
      imageUrl: imageUrl || null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.posts.unshift(post);
    save();
    return post;
  },
  updatePost(postId, body, imageUrl) {
    const post = this.getPostById(postId);
    if (!post) return null;
    post.body = body;
    post.imageUrl = imageUrl;
    post.updatedAt = nowIso();
    save();
    return post;
  },
  deletePost(postId) {
    const id = Number(postId);
    db.posts = db.posts.filter((p) => p.id !== id);
    db.comments = db.comments.filter((c) => c.postId !== id);
    db.likes = db.likes.filter((l) => l.postId !== id);
    save();
  },

  // ---------- comments ----------
  getCommentsByPost(postId) {
    return db.comments
      .filter((c) => c.postId === Number(postId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },
  getCommentCount(postId) {
    return db.comments.filter((c) => c.postId === Number(postId)).length;
  },
  createComment(postId, userId, body) {
    const comment = {
      id: nextId("comments"),
      postId: Number(postId),
      userId: Number(userId),
      body,
      createdAt: nowIso(),
    };
    db.comments.push(comment);
    save();
    return comment;
  },
  deleteComment(commentId) {
    db.comments = db.comments.filter((c) => c.id !== Number(commentId));
    save();
  },

  // ---------- likes ----------
  getLikeCount(postId) {
    return db.likes.filter((l) => l.postId === Number(postId)).length;
  },
  isLikedBy(postId, userId) {
    return db.likes.some((l) => l.postId === Number(postId) && l.userId === Number(userId));
  },
  toggleLike(postId, userId) {
    const existing = db.likes.find(
      (l) => l.postId === Number(postId) && l.userId === Number(userId)
    );
    if (existing) {
      db.likes = db.likes.filter((l) => l !== existing);
      save();
      return false;
    }
    db.likes.push({
      id: nextId("likes"),
      postId: Number(postId),
      userId: Number(userId),
      createdAt: nowIso(),
    });
    save();
    return true;
  },

  // ---------- follows ----------
  getFollowingCount(userId) {
    return db.follows.filter((f) => f.followerId === Number(userId)).length;
  },
  getFollowerCount(userId) {
    return db.follows.filter((f) => f.followedId === Number(userId)).length;
  },
  getFollowing(userId) {
    return db.follows
      .filter((f) => f.followerId === Number(userId))
      .map((f) => this.getUserById(f.followedId))
      .filter(Boolean);
  },
  getFollowers(userId) {
    return db.follows
      .filter((f) => f.followedId === Number(userId))
      .map((f) => this.getUserById(f.followerId))
      .filter(Boolean);
  },
  isFollowing(followerId, followedId) {
    return db.follows.some(
      (f) => f.followerId === Number(followerId) && f.followedId === Number(followedId)
    );
  },
  toggleFollow(followerId, followedId) {
    followerId = Number(followerId);
    followedId = Number(followedId);
    if (followerId === followedId) return null;
    const existing = db.follows.find(
      (f) => f.followerId === followerId && f.followedId === followedId
    );
    if (existing) {
      db.follows = db.follows.filter((f) => f !== existing);
      save();
      return false;
    }
    db.follows.push({
      id: nextId("follows"),
      followerId,
      followedId,
      createdAt: nowIso(),
    });
    save();
    return true;
  },
};
