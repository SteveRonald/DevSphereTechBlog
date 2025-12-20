-- Chat Limits Table
-- Tracks chat usage per user/session for rate limiting

CREATE TABLE IF NOT EXISTS chat_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for anonymous users
  session_id TEXT NOT NULL, -- For anonymous users
  chat_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_id) -- Prevent duplicates
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_id ON chat_usage(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_usage_session_id ON chat_usage(session_id) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_usage_last_reset ON chat_usage(last_reset_at);

-- Helper function to get current time in Nairobi timezone
CREATE OR REPLACE FUNCTION nairobi_now()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Nairobi';
END;
$$ LANGUAGE plpgsql;

-- Function to get or create chat usage record
CREATE OR REPLACE FUNCTION get_or_create_chat_usage(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  session_id TEXT,
  chat_count INTEGER,
  last_reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_record chat_usage%ROWTYPE;
  v_nairobi_now TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Nairobi timezone
  v_nairobi_now := (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Nairobi';
  
  -- Try to find existing record
  SELECT * INTO v_record
  FROM chat_usage
  WHERE (p_user_id IS NOT NULL AND chat_usage.user_id = p_user_id)
     OR (p_user_id IS NULL AND chat_usage.session_id = p_session_id AND chat_usage.user_id IS NULL)
  LIMIT 1;

  -- If not found, create new record
  -- Convert UTC to Nairobi timezone for storage
  IF NOT FOUND THEN
    INSERT INTO chat_usage (user_id, session_id, chat_count, last_reset_at, created_at, updated_at)
    VALUES (
      p_user_id, 
      p_session_id, 
      0, 
      (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
      (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
      (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz
    )
    RETURNING * INTO v_record;
  END IF;

  -- Reset count if it's been more than 24 hours (daily reset) - using Nairobi time
  IF v_record.last_reset_at < (NOW() - INTERVAL '24 hours') THEN
    UPDATE chat_usage
    SET 
      chat_count = 0, 
      last_reset_at = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
      updated_at = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT v_record.id, v_record.user_id, v_record.session_id, v_record.chat_count, v_record.last_reset_at;
END;
$$ LANGUAGE plpgsql;

-- Function to increment chat count
CREATE OR REPLACE FUNCTION increment_chat_count(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Get or create usage record
  PERFORM get_or_create_chat_usage(p_session_id, p_user_id);

  -- Increment count - store in Nairobi timezone
  UPDATE chat_usage
  SET 
    chat_count = chat_count + 1,
    updated_at = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz
  WHERE (p_user_id IS NOT NULL AND chat_usage.user_id = p_user_id)
     OR (p_user_id IS NULL AND chat_usage.session_id = p_session_id AND chat_usage.user_id IS NULL)
  RETURNING chat_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view their own usage" ON chat_usage;
DROP POLICY IF EXISTS "Anyone can create usage" ON chat_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON chat_usage;

-- Allow viewing: own user_id OR anonymous (user_id IS NULL)
CREATE POLICY "Anyone can view their own usage" ON chat_usage FOR SELECT USING (
  user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL)
);

-- Allow creating: anyone can create
CREATE POLICY "Anyone can create usage" ON chat_usage FOR INSERT WITH CHECK (true);

-- Allow updating: own user_id OR anonymous sessions (user_id IS NULL)
-- For anonymous users, we match by session_id
CREATE POLICY "Users can update their own usage" ON chat_usage FOR UPDATE USING (
  user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL)
);

-- Enable RLS
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

