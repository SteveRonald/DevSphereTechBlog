-- Drop all existing policies on reviews table
DROP POLICY IF EXISTS "Allow public read access to published reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to update reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users to delete reviews" ON reviews;

-- Disable RLS temporarily to clear any issues
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for reviews table

-- 1. Allow public to read published reviews
CREATE POLICY "reviews_public_read"
ON reviews FOR SELECT
TO public
USING (published = true);

-- 2. Allow authenticated users to read all reviews (for admin)
CREATE POLICY "reviews_authenticated_read_all"
ON reviews FOR SELECT
TO authenticated
USING (true);

-- 3. Allow authenticated users to insert reviews
CREATE POLICY "reviews_authenticated_insert"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Allow authenticated users to update any review (for admin)
CREATE POLICY "reviews_authenticated_update"
ON reviews FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Allow authenticated users to delete any review (for admin)
CREATE POLICY "reviews_authenticated_delete"
ON reviews FOR DELETE
TO authenticated
USING (true);
