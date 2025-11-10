-- Comprehensive Feature Addition Migration
-- Features: Notifications, Messaging, Follow System, History, Preferences

-- ============================================
-- 1. NOTIFICATIONS SYSTEM
-- ============================================

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'application_status',     -- Application status changed
  'new_application',        -- Company receives new application
  'new_internship',         -- New internship matching followed topics
  'company_message',        -- Message from company
  'student_message',        -- Message from student
  'internship_deadline',    -- Internship deadline approaching
  'system'                  -- System notifications
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,                -- Optional link to navigate to
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 2. USER PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  email_application_status BOOLEAN DEFAULT TRUE,
  email_new_messages BOOLEAN DEFAULT TRUE,
  email_new_internships BOOLEAN DEFAULT TRUE,
  browser_notifications BOOLEAN DEFAULT TRUE,
  tutorial_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MESSAGING SYSTEM
-- ============================================

-- Conversations between companies and students
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id)
);

CREATE INDEX idx_conversations_company ON conversations(company_id, last_message_at DESC);
CREATE INDEX idx_conversations_student ON conversations(student_id, last_message_at DESC);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);

-- ============================================
-- 4. FOLLOW SYSTEM (Companies & Topics)
-- ============================================

-- Topics/Tags for internships and following
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_slug ON topics(slug);

-- Internship topics/tags
CREATE TABLE IF NOT EXISTS internship_topics (
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (internship_id, topic_id)
);

-- Students following companies
CREATE TABLE IF NOT EXISTS company_followers (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, company_id)
);

CREATE INDEX idx_company_followers_student ON company_followers(student_id);
CREATE INDEX idx_company_followers_company ON company_followers(company_id);

-- Students following topics
CREATE TABLE IF NOT EXISTS topic_followers (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, topic_id)
);

CREATE INDEX idx_topic_followers_student ON topic_followers(student_id);
CREATE INDEX idx_topic_followers_topic ON topic_followers(topic_id);

-- ============================================
-- 5. INTERNSHIP HISTORY
-- ============================================

-- Track completed/attended internships
CREATE TABLE IF NOT EXISTS internship_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,  -- Store company name in case company is deleted
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'completed',  -- completed, ongoing, terminated
  certificate_url TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_student ON internship_history(student_id, end_date DESC);

-- ============================================
-- 6. ENHANCED APPLICATION TRACKING
-- ============================================

-- Add more fields to applications for better tracking
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS viewed_by_company BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS response_message TEXT,
ADD COLUMN IF NOT EXISTS interview_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ;

-- ============================================
-- 7. INTERNSHIP ENHANCEMENTS
-- ============================================

-- Add deadline and duration fields
ALTER TABLE internships
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS duration_weeks INT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS perks TEXT[];

-- ============================================
-- 8. ANALYTICS TRACKING
-- ============================================

-- Track internship views
CREATE TABLE IF NOT EXISTS internship_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_internship_views ON internship_views(internship_id, viewed_at DESC);

-- ============================================
-- 9. SEED COMMON TOPICS
-- ============================================

INSERT INTO topics (name, slug, description) VALUES
  ('Python', 'python', 'Python development and programming'),
  ('JavaScript', 'javascript', 'JavaScript and web development'),
  ('React', 'react', 'React.js frontend development'),
  ('Node.js', 'nodejs', 'Node.js backend development'),
  ('Machine Learning', 'machine-learning', 'ML and AI development'),
  ('Data Science', 'data-science', 'Data analysis and science'),
  ('DevOps', 'devops', 'DevOps and cloud infrastructure'),
  ('Mobile Development', 'mobile-development', 'iOS and Android development'),
  ('Full Stack', 'full-stack', 'Full stack development'),
  ('Backend', 'backend', 'Backend development'),
  ('Frontend', 'frontend', 'Frontend development'),
  ('UI/UX', 'ui-ux', 'UI/UX design'),
  ('Cybersecurity', 'cybersecurity', 'Security and cybersecurity'),
  ('Cloud Computing', 'cloud-computing', 'Cloud platforms and services'),
  ('Docker', 'docker', 'Docker and containerization'),
  ('Kubernetes', 'kubernetes', 'Kubernetes orchestration'),
  ('AWS', 'aws', 'Amazon Web Services'),
  ('Java', 'java', 'Java development'),
  ('C++', 'cpp', 'C++ programming'),
  ('Go', 'go', 'Go programming language')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 10. FUNCTIONS FOR NOTIFICATIONS
-- ============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. TRIGGERS
-- ============================================

-- Trigger: Notify student when application status changes
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  student_profile_id UUID;
  internship_title TEXT;
  company_name TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get student profile ID
    SELECT profile_id INTO student_profile_id
    FROM students WHERE id = NEW.student_id;
    
    -- Get internship and company details
    SELECT i.title, c.name INTO internship_title, company_name
    FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.id = NEW.internship_id;
    
    -- Create notification
    PERFORM create_notification(
      student_profile_id,
      'application_status',
      'Application Status Updated',
      format('Your application for %s at %s is now: %s', internship_title, company_name, NEW.status),
      format('/student/applications')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_status_change
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();

-- Trigger: Notify company of new application
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
DECLARE
  company_profile_id UUID;
  student_name TEXT;
  internship_title TEXT;
BEGIN
  -- Get company profile ID
  SELECT c.profile_id INTO company_profile_id
  FROM companies c
  JOIN internships i ON i.company_id = c.id
  WHERE i.id = NEW.internship_id;
  
  -- Get student name and internship title
  SELECT p.display_name INTO student_name
  FROM students s
  JOIN profiles p ON s.profile_id = p.id
  WHERE s.id = NEW.student_id;
  
  SELECT title INTO internship_title
  FROM internships WHERE id = NEW.internship_id;
  
  -- Create notification
  PERFORM create_notification(
    company_profile_id,
    'new_application',
    'New Application Received',
    format('%s applied for %s', COALESCE(student_name, 'A student'), internship_title),
    format('/company/matches')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_application_notification
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_application();

-- Trigger: Create conversation when application is created
CREATE OR REPLACE FUNCTION create_conversation_for_application()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Get company_id from internship
  SELECT company_id INTO v_company_id
  FROM internships WHERE id = NEW.internship_id;
  
  -- Create conversation
  INSERT INTO conversations (application_id, company_id, student_id)
  VALUES (NEW.id, v_company_id, NEW.student_id)
  ON CONFLICT (application_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_conversation_on_application
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_for_application();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE notifications IS 'System-wide notifications for all users';
COMMENT ON TABLE user_preferences IS 'User notification and UI preferences';
COMMENT ON TABLE conversations IS 'Chat conversations between companies and students';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON TABLE topics IS 'Topics/tags for categorizing internships';
COMMENT ON TABLE company_followers IS 'Students following companies';
COMMENT ON TABLE topic_followers IS 'Students following topics';
COMMENT ON TABLE internship_history IS 'Completed internship records for students';
