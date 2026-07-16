-- =====================================================
-- 完全なテーブル定義（新規インストール用）
-- 既存DBには下部の ALTER TABLE でカラムが追加される
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL    PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    display_name  VARCHAR(50)  NOT NULL,
    bio           VARCHAR(160),
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
