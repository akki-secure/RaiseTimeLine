-- perf-test用の大量データ投入スクリプト。
-- 実行例: docker compose exec -T postgres psql -U postgres -d raisetimeline -f - < perf-test/scripts/seed/seed-bulk.sql
--
-- 生成されるデータ:
--   - perf-user-1 ... perf-user-200 （email: perf-user-N@example.com）
--   - 各ユーザーにつき投稿を複数件（合計 約5000件）
--   - 一部の投稿にランダムないいねを付与（like-toggleシナリオの対象postを厚めにする）
--
-- パスワードは全ユーザー共通で "perfpass123"。
-- 以下のハッシュは generate-seed-hash.sh (README参照) で事前生成したBCryptハッシュを
-- 固定値として埋め込んでいる（実行のたびにハッシュ計算する必要はない）。
--   $2b$10$z9Gag7hl2scMjdkuo9JlUOlTvmxYKfc1x4EigqzAg2qF6s31bir2m = perfpass123

-- 既存のperfデータを一旦削除（再実行しても重複しないように）
DELETE FROM likes WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf-user-%');
DELETE FROM comments WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf-user-%');
DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf-user-%');
DELETE FROM users WHERE username LIKE 'perf-user-%';

-- 200人のperfユーザーを作成
INSERT INTO users (email, password_hash, username, display_name, created_at, updated_at)
SELECT
    'perf-user-' || n || '@example.com',
    '$2b$10$z9Gag7hl2scMjdkuo9JlUOlTvmxYKfc1x4EigqzAg2qF6s31bir2m',
    'perf-user-' || n,
    'Perf User ' || n,
    NOW(),
    NOW()
FROM generate_series(1, 200) AS n;

-- 各ユーザーにつき25件、合計5000件の投稿を作成（timeline-read.jsの検証に十分な件数）
INSERT INTO posts (user_id, body, created_at, updated_at)
SELECT
    u.id,
    'perf-seed-post ' || u.username || ' #' || p,
    NOW() - (random() * INTERVAL '30 days'),
    NOW() - (random() * INTERVAL '30 days')
FROM users u
CROSS JOIN generate_series(1, 25) AS p
WHERE u.username LIKE 'perf-user-%';

-- 投稿全体の約2割にランダムないいねを付与（like-toggleの対象post選定・タイムラインのlikeCount表示検証用）
INSERT INTO likes (post_id, user_id, created_at)
SELECT
    liked.post_id,
    liker.id,
    NOW()
FROM (
    SELECT id AS post_id
    FROM posts
    WHERE body LIKE 'perf-seed-post %'
    AND random() < 0.2
) liked
CROSS JOIN LATERAL (
    SELECT id
    FROM users
    WHERE username LIKE 'perf-user-%'
    ORDER BY random()
    LIMIT (5 + floor(random() * 20))::int
) liker
ON CONFLICT (post_id, user_id) DO NOTHING;
