-- Image Upload Limits Table
-- Tracks daily image uploads per user to prevent token overuse

CREATE TABLE IF NOT EXISTS image_upload_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_image_upload_usage_user_id ON image_upload_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_image_upload_usage_last_reset ON image_upload_usage(last_reset_at);

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own image usage" ON image_upload_usage;
DROP POLICY IF EXISTS "Users can create image usage" ON image_upload_usage;
DROP POLICY IF EXISTS "Users can update their own image usage" ON image_upload_usage;

CREATE POLICY "Users can view their own image usage" ON image_upload_usage 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create image usage" ON image_upload_usage 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own image usage" ON image_upload_usage 
  FOR UPDATE USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE image_upload_usage ENABLE ROW LEVEL SECURITY;

-- Function to get or create image upload usage for a user
CREATE OR REPLACE FUNCTION get_or_create_image_usage(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  upload_count INTEGER,
  last_reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_record image_upload_usage%ROWTYPE;
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz;
  
  -- Try to find existing record
  SELECT * INTO v_record
  FROM image_upload_usage
  WHERE image_upload_usage.user_id = p_user_id
  LIMIT 1;
  
  -- If found, check if we need to reset (new day)
  IF FOUND THEN
    -- Check if last_reset_at is from a different day (in Nairobi timezone)
    IF DATE(v_record.last_reset_at AT TIME ZONE 'Africa/Nairobi') < DATE(v_now AT TIME ZONE 'Africa/Nairobi') THEN
      -- Reset count for new day
      UPDATE image_upload_usage
      SET 
        upload_count = 0,
        last_reset_at = v_now,
        updated_at = v_now
      WHERE image_upload_usage.user_id = p_user_id
      RETURNING * INTO v_record;
    END IF;
    
    RETURN QUERY SELECT * FROM image_upload_usage WHERE image_upload_usage.user_id = p_user_id;
  ELSE
    -- If not found, create new record
    INSERT INTO image_upload_usage (user_id, upload_count, last_reset_at, created_at, updated_at)
    VALUES (
      p_user_id,
      0,
      v_now,
      v_now,
      v_now
    )
    RETURNING * INTO v_record;
    
    RETURN QUERY SELECT * FROM image_upload_usage WHERE image_upload_usage.user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment image upload count
CREATE OR REPLACE FUNCTION increment_image_upload_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz;
  
  -- Get or create usage record (this will reset if new day)
  PERFORM get_or_create_image_usage(p_user_id);
  
  -- Increment the count
  UPDATE image_upload_usage
  SET 
    upload_count = upload_count + 1,
    updated_at = v_now
  WHERE image_upload_usage.user_id = p_user_id
  RETURNING upload_count INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

