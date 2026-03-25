-- AlmaMatters: Posts Tables Migration
-- Run this if the posts tables are missing from your database:
--   mysql -u root -p almamatters < create_posts_tables.sql

USE almamatters;

-- =============================================
-- POSTS & FEED
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    post_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    poster_type ENUM('student', 'alumni', 'admin') NOT NULL,
    poster_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    like_count INT UNSIGNED DEFAULT 0,
    comment_count INT UNSIGNED DEFAULT 0,
    share_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_posts_created_at (created_at DESC)
);

CREATE TABLE IF NOT EXISTS post_likes (
    like_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    liker_type ENUM('student', 'alumni', 'admin') NOT NULL,
    liker_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_post_like (post_id, liker_type, liker_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_comments (
    comment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    parent_comment_id BIGINT DEFAULT NULL,
    commenter_type ENUM('student', 'alumni', 'admin') NOT NULL,
    commenter_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES post_comments(comment_id) ON DELETE CASCADE,
    INDEX idx_comments_post_id (post_id)
);

CREATE TABLE IF NOT EXISTS post_shares (
    share_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    sharer_type ENUM('student', 'alumni', 'admin') NOT NULL,
    sharer_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

-- =============================================
-- TRIGGERS (drop first to avoid duplicate errors)
-- =============================================
DROP TRIGGER IF EXISTS trg_like_insert;
DROP TRIGGER IF EXISTS trg_like_delete;
DROP TRIGGER IF EXISTS trg_comment_insert;
DROP TRIGGER IF EXISTS trg_comment_delete;
DROP TRIGGER IF EXISTS trg_share_insert;
DROP TRIGGER IF EXISTS trg_share_delete;

CREATE TRIGGER trg_like_insert AFTER INSERT ON post_likes
FOR EACH ROW
    UPDATE posts SET like_count = like_count + 1 WHERE post_id = NEW.post_id;

CREATE TRIGGER trg_like_delete AFTER DELETE ON post_likes
FOR EACH ROW
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE post_id = OLD.post_id;

CREATE TRIGGER trg_comment_insert AFTER INSERT ON post_comments
FOR EACH ROW
    UPDATE posts SET comment_count = comment_count + 1 WHERE post_id = NEW.post_id;

CREATE TRIGGER trg_comment_delete AFTER DELETE ON post_comments
FOR EACH ROW
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE post_id = OLD.post_id;

CREATE TRIGGER trg_share_insert AFTER INSERT ON post_shares
FOR EACH ROW
    UPDATE posts SET share_count = share_count + 1 WHERE post_id = NEW.post_id;

CREATE TRIGGER trg_share_delete AFTER DELETE ON post_shares
FOR EACH ROW
    UPDATE posts SET share_count = GREATEST(share_count - 1, 0) WHERE post_id = OLD.post_id;
