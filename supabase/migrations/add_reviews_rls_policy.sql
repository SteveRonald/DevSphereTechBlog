-- Enable RLS on reviews table if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to published reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own reviews" ON reviews;

-- Create policy for public read access to published reviews
CREATE POLICY "Allow public read access to published reviews"
ON reviews FOR SELECT
USING (published = true);

-- Create policy for authenticated users to insert reviews
CREATE POLICY "Allow authenticated users to insert reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update reviews
CREATE POLICY "Allow authenticated users to update reviews"
ON reviews FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete reviews
CREATE POLICY "Allow authenticated users to delete reviews"
ON reviews FOR DELETE
TO authenticated
USING (true);
