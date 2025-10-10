-- Cloudflare D1 Schema Migration
--
-- This file defines the initial database schema for the application,
-- migrated from Supabase to Cloudflare D1.
--

-- ----------------------------------------------------------------
-- Table for storing user accounts and profile information.
-- Replaces Supabase's auth.users and user_metadata.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                      -- Unique identifier for the user (e.g., UUID)
    email TEXT NOT NULL UNIQUE,               -- User's email address, used for login
    password_hash TEXT NOT NULL,              -- Hashed password for authentication
    name_account TEXT,                        -- The user's account/display name
    name_user TEXT,                           -- The user's full legal name
    phone_user TEXT,                          -- The user's phone number
    email_confirmed_at TIMESTAMP,             -- Timestamp when the user confirmed their email
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of account creation
);

-- ----------------------------------------------------------------
-- Table for forum posts.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Auto-incrementing primary key for the post
    user_id TEXT NOT NULL,                    -- Foreign key linking to the users table
    title TEXT NOT NULL,                      -- Title of the post
    content TEXT NOT NULL,                    -- Main content of the post
    user_name TEXT,                           -- Cached user name for display
    user_avatar_char TEXT,                    -- Cached avatar character for display
    comment_count INTEGER DEFAULT 0,          -- Count of comments on the post
    like_count INTEGER DEFAULT 0,             -- Count of likes on the post
    dislike_count INTEGER DEFAULT 0,          -- Count of dislikes on the post
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of post creation
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- Table for comments on forum posts.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Auto-incrementing primary key for the comment
    post_id INTEGER NOT NULL,                 -- Foreign key linking to the posts table
    user_id TEXT NOT NULL,                    -- Foreign key linking to the users table
    content TEXT NOT NULL,                    -- The text content of the comment
    user_name TEXT,                           -- Cached user name for display
    user_avatar_char TEXT,                    -- Cached avatar character for display
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of comment creation
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- Table for tracking user votes (likes/dislikes) on posts.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Auto-incrementing primary key
    user_id TEXT NOT NULL,                    -- Foreign key linking to the users table
    post_id INTEGER NOT NULL,                 -- Foreign key linking to the posts table
    vote_type INTEGER NOT NULL CHECK(vote_type IN (1, -1)), -- 1 for like, -1 for dislike
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE(user_id, post_id)                  -- Ensures a user can only vote once per post
);

-- ----------------------------------------------------------------
-- Table for tracking user progress in courses.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_progress (
    user_id TEXT NOT NULL,                    -- Foreign key to the users table
    course_id TEXT NOT NULL,                  -- Identifier for the course
    completed_lessons TEXT NOT NULL,          -- JSON array of completed lesson IDs
    updated_at TIMESTAMP,                     -- Timestamp of the last progress update
    PRIMARY KEY (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- Table for storing quiz results.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Auto-incrementing primary key
    user_id TEXT NOT NULL,                    -- Foreign key to the users table
    quiz_id TEXT NOT NULL,                    -- Identifier for the quiz
    score INTEGER NOT NULL,                   -- The score the user achieved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the quiz attempt
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);