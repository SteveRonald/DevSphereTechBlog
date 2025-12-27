CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_unique_public_name
  ON chat_rooms (LOWER(name))
  WHERE course_id IS NULL;

CREATE TABLE IF NOT EXISTS chat_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_room_messages_room_id_created_at
  ON chat_room_messages(room_id, created_at);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can update own rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Admins can update any room" ON chat_rooms;
DROP POLICY IF EXISTS "Creators or admins can delete rooms" ON chat_rooms;

CREATE POLICY "Authenticated users can read rooms" ON chat_rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create rooms" ON chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Authenticated users can update own rooms" ON chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any room" ON chat_rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

CREATE POLICY "Creators or admins can delete rooms" ON chat_rooms
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read messages" ON chat_room_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_room_messages;
DROP POLICY IF EXISTS "Authenticated users can delete own messages" ON chat_room_messages;
DROP POLICY IF EXISTS "Admins can delete any messages" ON chat_room_messages;

CREATE POLICY "Authenticated users can read messages" ON chat_room_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can send messages" ON chat_room_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own messages" ON chat_room_messages
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any messages" ON chat_room_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

INSERT INTO chat_rooms (name, is_public, created_by)
SELECT 'General', TRUE, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms WHERE LOWER(name) = 'general' AND course_id IS NULL
);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
