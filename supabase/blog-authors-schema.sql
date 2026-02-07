-- Blog Authors Schema
-- Dedicated authors table for blog posts with full profile support

-- Create blog_authors table FIRST (blog_posts will reference it)
CREATE TABLE IF NOT EXISTS blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  bio_html TEXT, -- Rich text bio (HTML)
  image_url TEXT,
  role TEXT, -- e.g., "Senior Developer", "Content Writer", "Tech Lead"
  email TEXT,
  website TEXT,
  twitter_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  active BOOLEAN DEFAULT true, -- Whether author is active and can be assigned to posts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_authors_slug ON blog_authors(slug);
CREATE INDEX IF NOT EXISTS idx_blog_authors_active ON blog_authors(active);
CREATE INDEX IF NOT EXISTS idx_blog_authors_name ON blog_authors(name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_authors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_blog_authors_updated_at
  BEFORE UPDATE ON blog_authors
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_authors_updated_at();

-- RLS Policies
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;

-- Public can read active authors
CREATE POLICY "Anyone can view active blog authors" ON blog_authors
  FOR SELECT
  USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage blog authors" ON blog_authors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Update blog_posts to reference blog_authors instead of auth.users
-- First, add the new column
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS blog_author_id UUID REFERENCES blog_authors(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_blog_posts_blog_author ON blog_posts(blog_author_id);

-- Note: The old author_id column (referencing auth.users) will remain for backward compatibility
-- You can migrate data if needed:
-- UPDATE blog_posts SET blog_author_id = (SELECT id FROM blog_authors WHERE ...) WHERE author_id = ...;

