-- Post Interactions Schema
-- Tables for likes, comments, saves, and shares

-- ============================================================================
-- Post Likes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_slug)
);

-- ============================================================================
-- Post Comments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_slug TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For nested comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- Post Saves Table (using existing bookmarks table, but adding a new one for clarity)
-- ============================================================================
-- Note: We already have a bookmarks table, but we'll use post_saves for consistency
CREATE TABLE IF NOT EXISTS post_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_slug)
);

-- ============================================================================
-- Post Shares Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow anonymous shares
  post_slug TEXT NOT NULL,
  platform TEXT, -- 'twitter', 'facebook', 'linkedin', 'copy', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Create Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_slug ON post_likes(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_slug ON post_comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_post_slug ON post_saves(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_slug ON post_shares(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id);

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for Post Likes
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

CREATE POLICY "Anyone can view likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for Post Comments
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for Post Saves
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own saves" ON post_saves;
DROP POLICY IF EXISTS "Users can save posts" ON post_saves;
DROP POLICY IF EXISTS "Users can unsave posts" ON post_saves;

CREATE POLICY "Users can view their own saves" ON post_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON post_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" ON post_saves
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for Post Shares
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view shares" ON post_shares;
DROP POLICY IF EXISTS "Anyone can create shares" ON post_shares;

CREATE POLICY "Anyone can view shares" ON post_shares
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create shares" ON post_shares
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Functions to get counts (for performance)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_post_likes_count(post_slug_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM post_likes WHERE post_slug = post_slug_param);
END;
$$;

CREATE OR REPLACE FUNCTION get_post_comments_count(post_slug_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM post_comments WHERE post_slug = post_slug_param);
END;
$$;

CREATE OR REPLACE FUNCTION get_post_saves_count(post_slug_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM post_saves WHERE post_slug = post_slug_param);
END;
$$;

CREATE OR REPLACE FUNCTION get_post_shares_count(post_slug_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM post_shares WHERE post_slug = post_slug_param);
END;
$$;

