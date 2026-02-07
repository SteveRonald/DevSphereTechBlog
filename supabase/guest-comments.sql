-- Add guest comment support to post_comments table
-- Allows non-authenticated users to comment with name and email

-- Add guest fields to post_comments
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Make user_id nullable for guest comments
ALTER TABLE post_comments
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: either user_id OR (guest_name AND guest_email) must be present
ALTER TABLE post_comments
ADD CONSTRAINT check_comment_author
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_name IS NOT NULL AND guest_email IS NOT NULL)
);

-- Update RLS policies to allow guest comments
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;

CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create comments" ON post_comments
  FOR INSERT WITH CHECK (
    (user_id IS NOT NULL) OR 
    (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

-- Users can update/delete their own comments
CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);
