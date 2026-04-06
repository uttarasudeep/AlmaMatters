-- Drop database if exists (optional – comment out if you don't want to lose data)
DROP DATABASE IF EXISTS almamatters;
CREATE DATABASE almamatters;
USE almamatters;

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE students (
    student_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE student_personal_details (
    student_id BIGINT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    date_of_birth DATE,
    gender VARCHAR(10),
    blood_group VARCHAR(5),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    aadhaar_number VARCHAR(20),
    passport_number VARCHAR(20),
    profile_photo_url TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE student_contact_details (
    student_id BIGINT PRIMARY KEY,
    email VARCHAR(150),
    phone_number VARCHAR(15),
    alternate_phone_number VARCHAR(15),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE student_address_details (
    student_id BIGINT PRIMARY KEY,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE student_areas_of_interest (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    area_of_interest VARCHAR(100) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE student_academic_details (
    student_id BIGINT PRIMARY KEY,
    batch_year YEAR,
    admission_date DATE,
    expected_graduation_date DATE,
    current_year INT,
    current_semester INT,
    section VARCHAR(10),
    academic_status VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE student_login_accounts (
    student_id BIGINT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    last_login TIMESTAMP,
    account_status VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- =============================================
-- ALUMNI
-- =============================================
CREATE TABLE alumni (
    alumni_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT UNIQUE NOT NULL,
    graduation_year YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE alumni_personal_details (
    alumni_id BIGINT PRIMARY KEY,
    linkedin_url TEXT,
    current_city VARCHAR(100),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE alumni_professional_details (
    alumni_id BIGINT PRIMARY KEY,
    company_name VARCHAR(150),
    job_title VARCHAR(150),
    industry VARCHAR(150),
    years_of_experience DECIMAL(4,1),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE alumni_login_accounts (
    alumni_id BIGINT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT,
    last_login TIMESTAMP,
    account_status VARCHAR(50),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE alumni_higher_studies_details (
    alumni_id BIGINT PRIMARY KEY,
    university_name VARCHAR(150),
    degree VARCHAR(150),
    field_of_study VARCHAR(150),
    country VARCHAR(100),
    start_year YEAR,
    end_year YEAR,
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE alumni_academic_details (
    alumni_id BIGINT PRIMARY KEY,
    department VARCHAR(150),
    program VARCHAR(100),
    course VARCHAR(150),
    batch_year YEAR,
    graduation_year YEAR,
    cgpa DECIMAL(4,2),
    class_obtained VARCHAR(50),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE alumni_address_details (
    alumni_id BIGINT PRIMARY KEY,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

-- =============================================
-- ADMINS
-- =============================================
CREATE TABLE admins (
    admin_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE admin_personal_details (
    admin_id BIGINT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_photo_url TEXT,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE TABLE admin_contact_details (
    admin_id BIGINT PRIMARY KEY,
    email VARCHAR(150),
    phone_number VARCHAR(15),
    alternate_phone_number VARCHAR(15),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE TABLE admin_address_details (
    admin_id BIGINT PRIMARY KEY,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE TABLE admin_login_accounts (
    admin_id BIGINT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    last_login TIMESTAMP,
    account_status VARCHAR(50),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- =============================================
-- POSTS & FEED
-- =============================================
CREATE TABLE posts (
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

CREATE TABLE post_likes (
    like_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    liker_type ENUM('student', 'alumni', 'admin') NOT NULL,
    liker_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_post_like (post_id, liker_type, liker_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE post_comments (
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

CREATE TABLE post_shares (
    share_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    sharer_type ENUM('student', 'alumni', 'admin') NOT NULL,
    sharer_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

-- =============================================
-- FOLLOWERS
-- =============================================
CREATE TABLE IF NOT EXISTS user_followers (
    follower_type ENUM('student', 'alumni', 'admin') NOT NULL,
    follower_id BIGINT NOT NULL,
    following_type ENUM('student', 'alumni', 'admin') NOT NULL,
    following_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_type, follower_id, following_type, following_id)
);

-- =============================================
-- JOBS
-- =============================================
CREATE TABLE jobs (
    job_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alumni_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT,
    stipend_salary VARCHAR(100),
    expectations TEXT,
    qualification VARCHAR(255),
    application_deadline DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE job_applications (
    application_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT NOT NULL,
    applicant_type ENUM('student', 'alumni') NOT NULL,
    applicant_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_job_application (job_id, applicant_type, applicant_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);

-- =============================================
-- SESSIONS
-- =============================================
CREATE TABLE sessions (
    session_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    requester_type ENUM('student', 'alumni') NOT NULL,
    requester_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at DATETIME,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by_admin_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE session_applications (
    application_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    applicant_type ENUM('student', 'alumni') NOT NULL,
    applicant_id BIGINT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_session_applicant (session_id, applicant_type, applicant_id),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_type ENUM('student', 'alumni', 'admin') NOT NULL,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
use almamatters;

CREATE TABLE IF NOT EXISTS user_followers (
  follower_type ENUM('student', 'alumni', 'admin') NOT NULL,
  follower_id BIGINT NOT NULL,
  following_type ENUM('student', 'alumni', 'admin') NOT NULL,
  following_id BIGINT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_type, follower_id, following_type, following_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  requester_type ENUM('student', 'alumni') NOT NULL,
  requester_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at DATETIME,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by_admin_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    job_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alumni_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT,
    stipend_salary VARCHAR(100),
    expectations TEXT,
    qualification VARCHAR(255),
    application_deadline DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
    application_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT NOT NULL,
    applicant_type ENUM('student', 'alumni') NOT NULL,
    applicant_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_job_application (job_id, applicant_type, applicant_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);
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


-- =============================================
-- TRIGGERS to keep post counts updated
-- =============================================
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