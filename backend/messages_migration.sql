-- AlmaMatters Messaging Tables Migration
-- Run: mysql -u root -p almamatters < messages_migration.sql

USE almamatters;

CREATE TABLE IF NOT EXISTS message_conversations (
  conversation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user1_type ENUM('student','alumni') NOT NULL,
  user1_id   BIGINT NOT NULL,
  user2_type ENUM('student','alumni') NOT NULL,
  user2_id   BIGINT NOT NULL,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conversation (user1_type, user1_id, user2_type, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  message_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL,
  sender_type     ENUM('student','alumni') NOT NULL,
  sender_id       BIGINT NOT NULL,
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES message_conversations(conversation_id) ON DELETE CASCADE,
  INDEX idx_conversation_created (conversation_id, created_at)
);

CREATE TABLE IF NOT EXISTS comment_likes (
  like_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  comment_id  BIGINT NOT NULL,
  liker_type  ENUM('student','alumni','admin') NOT NULL,
  liker_id    BIGINT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_comment_like (comment_id, liker_type, liker_id),
  FOREIGN KEY (comment_id) REFERENCES post_comments(comment_id) ON DELETE CASCADE
);
