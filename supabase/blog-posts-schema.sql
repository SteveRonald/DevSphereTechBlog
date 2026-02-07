-- Blog Posts Schema
-- Replaces Sanity CMS with Supabase-native blog system

-- Create categories table FIRST (blog_posts references it)
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_posts table AFTER categories (since it references blog_categories)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text content (can be JSONB or markdown)
  content_type TEXT DEFAULT 'markdown', -- 'markdown' or 'html'
  main_image_url TEXT,
  main_image_alt TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  read_time INTEGER DEFAULT 5, -- in minutes
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[], -- Array of tags
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Function to calculate read time (approximate: 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_read_time(content TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, CEIL(array_length(string_to_array(content, ' '), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
  FOR SELECT
  USING (published = true);

-- Public can read categories
CREATE POLICY "Anyone can view blog categories" ON blog_categories
  FOR SELECT
  USING (true);

-- Public can read tags
CREATE POLICY "Anyone can view blog tags" ON blog_tags
  FOR SELECT
  USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage blog posts" ON blog_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage blog categories" ON blog_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage blog tags" ON blog_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Insert default categories
INSERT INTO blog_categories (title, slug, description) VALUES
  ('Web Development', 'web-development', 'Articles about web development technologies and practices'),
  ('React', 'react', 'React.js tutorials and guides'),
  ('Next.js', 'nextjs', 'Next.js framework content'),
  ('TypeScript', 'typescript', 'TypeScript programming language'),
  ('JavaScript', 'javascript', 'JavaScript tutorials and tips'),
  ('AI & Machine Learning', 'ai-machine-learning', 'Artificial intelligence and machine learning content'),
  ('Career', 'career', 'Career advice and developer career tips'),
  ('Reviews', 'reviews', 'Product and tool reviews'),
  ('Tutorials', 'tutorials', 'Step-by-step tutorials'),
  ('Code Snippets', 'code-snippets', 'Useful code snippets and examples')
ON CONFLICT (slug) DO NOTHING;

-- Function to notify subscribers when a blog post is published
CREATE OR REPLACE FUNCTION notify_blog_post_published()
RETURNS TRIGGER AS $$
DECLARE
  site_url TEXT;
  notification_url TEXT;
BEGIN
  -- Only trigger if post is being published (was draft, now published)
  IF NEW.published = true AND (OLD.published = false OR OLD.published IS NULL) THEN
    -- Get site URL from environment or use default
    site_url := COALESCE(
      current_setting('app.site_url', true),
      'https://codecraftacademy.com'
    );
    
    -- Construct notification API URL
    notification_url := site_url || '/api/newsletter/notify-new-post';
    
    -- Call the notification API via HTTP (requires pg_net extension or similar)
    -- For now, we'll use a database function that can be called from the application
    -- The actual HTTP call will be made from the application layer
    
    -- Store notification request in a queue table (optional)
    -- Or rely on application to call API after successful publish
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call notification function when post is published
CREATE TRIGGER trigger_notify_blog_post_published
  AFTER UPDATE OF published ON blog_posts
  FOR EACH ROW
  WHEN (NEW.published = true AND (OLD.published = false OR OLD.published IS NULL))
  EXECUTE FUNCTION notify_blog_post_published();

-- Also trigger on INSERT if post is published immediately
CREATE TRIGGER trigger_notify_blog_post_published_insert
  AFTER INSERT ON blog_posts
  FOR EACH ROW
  WHEN (NEW.published = true)
  EXECUTE FUNCTION notify_blog_post_published();

