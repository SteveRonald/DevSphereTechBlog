-- Add user_id column to chat_conversations table
-- This allows conversations to be tied to logged-in users

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_conversations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);

-- Update RLS policies to allow users to view their own conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
CREATE POLICY "Users can view their own conversations" ON chat_conversations 
  FOR SELECT USING (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Update insert policy to allow users to create conversations with their user_id
DROP POLICY IF EXISTS "Anyone can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations" ON chat_conversations 
  FOR INSERT WITH CHECK (true);

-- Keep update policy for rating
DROP POLICY IF EXISTS "Anyone can update conversations" ON chat_conversations;
CREATE POLICY "Users can update their own conversations" ON chat_conversations 
  FOR UPDATE USING (
    user_id = auth.uid() OR user_id IS NULL
  );

