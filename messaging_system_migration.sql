-- Messaging System Migration
-- Simplified approach: Messages linked directly to applications

-- Drop existing messaging tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- ============================================
-- MESSAGING SYSTEM (Simplified)
-- ============================================

-- Messages table - directly linked to applications
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,           -- Student ID or Company ID
  sender_type TEXT NOT NULL CHECK (sender_type IN ('student', 'company')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_application ON messages(application_id, created_at ASC);
CREATE INDEX idx_messages_unread ON messages(application_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- INTERNSHIP HISTORY
-- ============================================

-- Status enum for internship history
DO $$ BEGIN
  CREATE TYPE internship_status AS ENUM ('ongoing', 'completed', 'terminated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Internship history table
CREATE TABLE IF NOT EXISTS internship_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  status internship_status NOT NULL DEFAULT 'ongoing',
  start_date DATE NOT NULL,
  end_date DATE,
  feedback TEXT,                     -- Company feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  certificate_url TEXT,              -- Link to certificate
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_internship_history_student ON internship_history(student_id, start_date DESC);
CREATE INDEX idx_internship_history_internship ON internship_history(internship_id);
CREATE INDEX idx_internship_history_status ON internship_history(status);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE messages IS 'Messages between students and companies for specific applications';
COMMENT ON TABLE internship_history IS 'Track student internship history with feedback and certificates';

COMMENT ON COLUMN messages.sender_id IS 'References either students.id or companies.id based on sender_type';
COMMENT ON COLUMN messages.sender_type IS 'Indicates whether sender is a student or company';
COMMENT ON COLUMN internship_history.status IS 'Current status of the internship experience';
COMMENT ON COLUMN internship_history.feedback IS 'Company feedback about student performance';
COMMENT ON COLUMN internship_history.certificate_url IS 'URL to completion certificate (if issued)';
