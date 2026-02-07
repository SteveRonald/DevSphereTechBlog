-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'markdown',
  main_image_url TEXT,
  main_image_alt TEXT,
  author_id UUID REFERENCES blog_authors(id),
  category_id UUID REFERENCES blog_categories(id),
  product_name TEXT NOT NULL,
  product_url TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
  pros TEXT,
  cons TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  read_time INTEGER DEFAULT 5,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_slug ON reviews(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(published);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(featured);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_name ON reviews(product_name);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_category_id ON reviews(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_tags ON reviews USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can view published reviews
CREATE POLICY "Public can view published reviews"
  ON reviews
  FOR SELECT
  USING (published = true);

-- Authenticated users can view all reviews
CREATE POLICY "Authenticated users can view all reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert reviews
CREATE POLICY "Admins can insert reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Only admins can update reviews
CREATE POLICY "Admins can update reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Only admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER trigger_update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Grant permissions
GRANT SELECT ON reviews TO anon;
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON reviews TO service_role;

-- Comments for documentation
COMMENT ON TABLE reviews IS 'Stores product and service reviews with markdown support';
COMMENT ON COLUMN reviews.title IS 'Review title';
COMMENT ON COLUMN reviews.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN reviews.excerpt IS 'Brief summary of the review';
COMMENT ON COLUMN reviews.content IS 'Full review content in Markdown format';
COMMENT ON COLUMN reviews.content_type IS 'Content format (markdown, html, etc.)';
COMMENT ON COLUMN reviews.product_name IS 'Name of the product/service being reviewed';
COMMENT ON COLUMN reviews.product_url IS 'URL to the product/service';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 (can include decimals like 4.5)';
COMMENT ON COLUMN reviews.pros IS 'Positive aspects in Markdown format';
COMMENT ON COLUMN reviews.cons IS 'Negative aspects in Markdown format';
COMMENT ON COLUMN reviews.featured IS 'Whether the review is featured';
COMMENT ON COLUMN reviews.published IS 'Whether the review is published and visible to public';
