-- AlmaMatters: Communities Tables Migration
-- Run this to create the missing communities tables
-- mysql -u root -p almamatters < create_communities_tables.sql

USE almamatters;

-- =============================================
-- COMMUNITIES
-- =============================================
CREATE TABLE IF NOT EXISTS communities (
    community_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_type ENUM('student', 'alumni', 'admin') NOT NULL,
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_communities_owner (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS community_members (
    membership_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    community_id BIGINT NOT NULL,
    user_type ENUM('student', 'alumni', 'admin') NOT NULL,
    user_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_community_member (community_id, user_type, user_id),
    FOREIGN KEY (community_id) REFERENCES communities(community_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_messages (
    message_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    community_id BIGINT NOT NULL,
    sender_type ENUM('student', 'alumni', 'admin') NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(community_id) ON DELETE CASCADE,
    INDEX idx_community_messages_created (community_id, created_at ASC)
);
