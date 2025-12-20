-- Set Nairobi Timezone for Timestamps
-- This script sets up timezone functions and ensures timestamps are handled in Nairobi timezone (Africa/Nairobi, UTC+3)

-- Set the timezone for the current session (optional - can be set per connection)
-- SET timezone = 'Africa/Nairobi';

-- Function to get current time in Nairobi timezone
CREATE OR REPLACE FUNCTION nairobi_now()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Convert UTC to Nairobi timezone
  RETURN (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Nairobi';
END;
$$ LANGUAGE plpgsql;

-- Function to convert any timestamp to Nairobi timezone
CREATE OR REPLACE FUNCTION to_nairobi_time(ts TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN ts AT TIME ZONE 'Africa/Nairobi';
END;
$$ LANGUAGE plpgsql;

-- Note: PostgreSQL stores TIMESTAMP WITH TIME ZONE in UTC internally
-- When you query timestamps, you can convert them to Nairobi timezone using:
-- SELECT created_at AT TIME ZONE 'Africa/Nairobi' as nairobi_time FROM chat_conversations;
-- Or use the function: SELECT to_nairobi_time(created_at) as nairobi_time FROM chat_conversations;

