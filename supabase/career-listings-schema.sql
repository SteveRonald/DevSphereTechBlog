-- Career Listings Table
CREATE TABLE IF NOT EXISTS career_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  salary_range TEXT,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  benefits TEXT,
  application_url TEXT,
  application_email TEXT,
  application_deadline TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_career_listings_slug ON career_listings(slug);
CREATE INDEX IF NOT EXISTS idx_career_listings_published ON career_listings(published);
CREATE INDEX IF NOT EXISTS idx_career_listings_featured ON career_listings(featured);
CREATE INDEX IF NOT EXISTS idx_career_listings_job_type ON career_listings(job_type);
CREATE INDEX IF NOT EXISTS idx_career_listings_created_at ON career_listings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE career_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can view published career listings
CREATE POLICY "Public can view published career listings"
  ON career_listings
  FOR SELECT
  USING (published = true);

-- Authenticated users can view all career listings
CREATE POLICY "Authenticated users can view all career listings"
  ON career_listings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert career listings
CREATE POLICY "Admins can insert career listings"
  ON career_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Only admins can update career listings
CREATE POLICY "Admins can update career listings"
  ON career_listings
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

-- Only admins can delete career listings
CREATE POLICY "Admins can delete career listings"
  ON career_listings
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
CREATE OR REPLACE FUNCTION update_career_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER trigger_update_career_listings_updated_at
  BEFORE UPDATE ON career_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_career_listings_updated_at();

-- Grant permissions
GRANT SELECT ON career_listings TO anon;
GRANT ALL ON career_listings TO authenticated;
GRANT ALL ON career_listings TO service_role;

-- Comments for documentation
COMMENT ON TABLE career_listings IS 'Stores job/career listings with markdown support for descriptions';
COMMENT ON COLUMN career_listings.title IS 'Job title';
COMMENT ON COLUMN career_listings.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN career_listings.company IS 'Company name';
COMMENT ON COLUMN career_listings.location IS 'Job location (e.g., Remote, New York, NY)';
COMMENT ON COLUMN career_listings.job_type IS 'Type of employment (Full-time, Part-time, Contract, etc.)';
COMMENT ON COLUMN career_listings.salary_range IS 'Salary range (e.g., $80k - $120k)';
COMMENT ON COLUMN career_listings.description IS 'Job description in Markdown format';
COMMENT ON COLUMN career_listings.requirements IS 'Job requirements in Markdown format';
COMMENT ON COLUMN career_listings.responsibilities IS 'Job responsibilities in Markdown format';
COMMENT ON COLUMN career_listings.benefits IS 'Job benefits in Markdown format';
COMMENT ON COLUMN career_listings.application_url IS 'External application URL';
COMMENT ON COLUMN career_listings.application_email IS 'Email for applications';
COMMENT ON COLUMN career_listings.application_deadline IS 'Application deadline date';
COMMENT ON COLUMN career_listings.featured IS 'Whether the listing is featured';
COMMENT ON COLUMN career_listings.published IS 'Whether the listing is published and visible to public';
