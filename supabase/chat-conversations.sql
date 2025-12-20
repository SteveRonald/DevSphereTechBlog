-- Chat Conversations Table
-- Stores all chatbot conversations for learning and analytics

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_question TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_used JSONB, -- Store what blog posts/categories were referenced
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5), -- 1-5 rating
  user_feedback TEXT, -- Optional feedback text
  response_time_ms INTEGER, -- Time taken to generate response
  model_used TEXT DEFAULT 'llama-3.1-8b-instant'
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_success_rating ON chat_conversations(success_rating);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_question_gin ON chat_conversations USING gin(to_tsvector('english', user_question));

-- RLS Policies (allow all reads and inserts for now, can be restricted later)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON chat_conversations;

CREATE POLICY "Anyone can view conversations" ON chat_conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can create conversations" ON chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update conversations" ON chat_conversations FOR UPDATE USING (true);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Function to convert timestamp to Nairobi timezone
CREATE OR REPLACE FUNCTION to_nairobi_time(ts TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN ts AT TIME ZONE 'Africa/Nairobi';
END;
$$ LANGUAGE plpgsql;

-- Function to get current time in Nairobi timezone
CREATE OR REPLACE FUNCTION nairobi_now()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Nairobi';
END;
$$ LANGUAGE plpgsql;

-- Function to get common questions (for FAQ generation)
CREATE OR REPLACE FUNCTION get_common_questions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  question TEXT,
  question_count BIGINT,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    user_question as question,
    COUNT(*) as question_count,
    AVG(COALESCE(success_rating, 0))::NUMERIC(10,2) as avg_rating
  FROM chat_conversations
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_question
  ORDER BY question_count DESC, avg_rating DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

