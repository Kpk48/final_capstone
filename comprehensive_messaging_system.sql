-- Comprehensive Messaging System
-- Supports messaging between any users: students, companies, and admins

-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants (can be any combination of users)
  participant1_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Optional: Link to application if conversation is about a specific application
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  
  -- Metadata
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique conversation between two users
  CONSTRAINT unique_participants UNIQUE (participant1_profile_id, participant2_profile_id),
  -- Ensure participant1 < participant2 (ordered)
  CONSTRAINT ordered_participants CHECK (participant1_profile_id < participant2_profile_id)
);

CREATE INDEX idx_conversations_participant1 ON conversations(participant1_profile_id, last_message_at DESC);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_profile_id, last_message_at DESC);
CREATE INDEX idx_conversations_application ON conversations(application_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- HELPER FUNCTION: Get or Create Conversation
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_profile_id UUID,
  p_user2_profile_id UUID,
  p_application_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
  v_participant1 UUID;
  v_participant2 UUID;
BEGIN
  -- Ensure participant1 < participant2 (ordered)
  IF p_user1_profile_id < p_user2_profile_id THEN
    v_participant1 := p_user1_profile_id;
    v_participant2 := p_user2_profile_id;
  ELSE
    v_participant1 := p_user2_profile_id;
    v_participant2 := p_user1_profile_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE participant1_profile_id = v_participant1
    AND participant2_profile_id = v_participant2;

  -- Create if doesn't exist
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (participant1_profile_id, participant2_profile_id, application_id)
    VALUES (v_participant1, v_participant2, p_application_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ============================================
-- FUNCTION: Update last_message_at on new message
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-update last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- MIGRATE EXISTING APPLICATION MESSAGES (If any)
-- ============================================

-- This will convert application-based messages to the new system
-- Run this if you have existing messages linked to applications

DO $$
DECLARE
  app_record RECORD;
  student_profile_id UUID;
  company_profile_id UUID;
  conv_id UUID;
BEGIN
  -- Loop through applications that might have messages
  FOR app_record IN 
    SELECT DISTINCT a.id as application_id, a.student_id, i.company_id
    FROM applications a
    JOIN internships i ON a.internship_id = i.id
  LOOP
    -- Get profile IDs
    SELECT profile_id INTO student_profile_id 
    FROM students WHERE id = app_record.student_id;
    
    SELECT profile_id INTO company_profile_id 
    FROM companies WHERE id = app_record.company_id;
    
    IF student_profile_id IS NOT NULL AND company_profile_id IS NOT NULL THEN
      -- Create conversation between student and company
      conv_id := get_or_create_conversation(
        student_profile_id, 
        company_profile_id, 
        app_record.application_id
      );
      
      RAISE NOTICE 'Created conversation for application: %', app_record.application_id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- VIEWS FOR EASIER QUERYING
-- ============================================

-- View: Conversations with participant details
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
  c.id as conversation_id,
  c.participant1_profile_id,
  c.participant2_profile_id,
  c.application_id,
  c.last_message_at,
  c.created_at,
  p1.display_name as participant1_name,
  p1.role as participant1_role,
  p1.email as participant1_email,
  p2.display_name as participant2_name,
  p2.role as participant2_role,
  p2.email as participant2_email,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
FROM conversations c
JOIN profiles p1 ON c.participant1_profile_id = p1.id
JOIN profiles p2 ON c.participant2_profile_id = p2.id;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE conversations IS 'Direct conversations between any two users (students, companies, or admins)';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON COLUMN conversations.participant1_profile_id IS 'First participant (always < participant2 for uniqueness)';
COMMENT ON COLUMN conversations.participant2_profile_id IS 'Second participant (always > participant1 for uniqueness)';
COMMENT ON COLUMN conversations.application_id IS 'Optional link to application if conversation is about specific application';
COMMENT ON FUNCTION get_or_create_conversation IS 'Helper function to get existing or create new conversation between two users';
