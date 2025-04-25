-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can view all media" ON media;
DROP POLICY IF EXISTS "Users can create media for own posts" ON media;
DROP POLICY IF EXISTS "Users can update media for own posts" ON media;
DROP POLICY IF EXISTS "Users can delete media for own posts" ON media;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    profile_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create posts table if not exists
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create media table if not exists
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    position INT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_media_position ON media(post_id, position);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
-- Users can read all users
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can read all posts
CREATE POLICY "Users can view all posts" ON posts
    FOR SELECT USING (true);

-- Users can create their own posts
CREATE POLICY "Users can create own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Users can read all media
CREATE POLICY "Users can view all media" ON media
    FOR SELECT USING (true);

-- Users can create media for their own posts
CREATE POLICY "Users can create media for own posts" ON media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = media.post_id
            AND posts.user_id::text = auth.uid()::text
        )
    );

-- Users can update media for their own posts
CREATE POLICY "Users can update media for own posts" ON media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = media.post_id
            AND posts.user_id::text = auth.uid()::text
        )
    );

-- Users can delete media for their own posts
CREATE POLICY "Users can delete media for own posts" ON media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = media.post_id
            AND posts.user_id::text = auth.uid()::text
        )
    ); 