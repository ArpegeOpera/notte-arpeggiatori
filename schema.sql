-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Anyone can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can create users" ON users;

DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can delete own posts" ON posts;

DROP POLICY IF EXISTS "Users can view all media" ON media;
DROP POLICY IF EXISTS "Anyone can view all media" ON media;
DROP POLICY IF EXISTS "Users can create media for own posts" ON media;
DROP POLICY IF EXISTS "Anyone can create media" ON media;
DROP POLICY IF EXISTS "Users can update media for own posts" ON media;
DROP POLICY IF EXISTS "Anyone can update media for own posts" ON media;
DROP POLICY IF EXISTS "Users can delete media for own posts" ON media;
DROP POLICY IF EXISTS "Anyone can delete media for own posts" ON media;

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
-- Anyone can read all users
CREATE POLICY "Anyone can view all users" ON users
    FOR SELECT USING (true);

-- Anyone can create users
CREATE POLICY "Anyone can create users" ON users
    FOR INSERT WITH CHECK (true);

-- Anyone can read all posts
CREATE POLICY "Anyone can view all posts" ON posts
    FOR SELECT USING (true);

-- Anyone can create posts
CREATE POLICY "Anyone can create posts" ON posts
    FOR INSERT WITH CHECK (true);

-- Anyone can update their own posts
CREATE POLICY "Anyone can update own posts" ON posts
    FOR UPDATE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Anyone can delete their own posts
CREATE POLICY "Anyone can delete own posts" ON posts
    FOR DELETE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Anyone can read all media
CREATE POLICY "Anyone can view all media" ON media
    FOR SELECT USING (true);

-- Anyone can create media
CREATE POLICY "Anyone can create media" ON media
    FOR INSERT WITH CHECK (true);

-- Anyone can update media for their own posts
CREATE POLICY "Anyone can update media for own posts" ON media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = media.post_id
            AND posts.user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Anyone can delete media for their own posts
CREATE POLICY "Anyone can delete media for own posts" ON media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = media.post_id
            AND posts.user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- After RLS policies, disable RLS for public access
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE media DISABLE ROW LEVEL SECURITY; 