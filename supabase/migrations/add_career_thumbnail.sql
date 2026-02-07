-- Add thumbnail_url column to career_listings table
ALTER TABLE career_listings
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN career_listings.thumbnail_url IS 'URL of the career listing thumbnail image';
