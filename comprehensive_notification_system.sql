-- Comprehensive Notification & Following System
-- Includes: Notifications, Email Preferences, Following (Companies/Topics), AI Analysis

-- ============================================
-- NOTIFICATION TYPES ENUM
-- ============================================

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'application_status',      -- Application status changed
        'new_applicant',          -- New applicant for company
        'new_message',            -- New message received
        'new_internship',         -- New internship matching interests
        'follow_company_post',    -- Company you follow posted
        'follow_topic_match',     -- New post matching followed topic
        'application_deadline',    -- Deadline approaching
        'interview_scheduled',     -- Interview scheduled
        'offer_received'          -- Offer received
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,  -- Link to relevant page
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    metadata JSONB,  -- Additional data (application_id, internship_id, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(profile_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Email Notifications
    email_application_status BOOLEAN DEFAULT TRUE,
    email_new_applicant BOOLEAN DEFAULT TRUE,
    email_new_message BOOLEAN DEFAULT TRUE,
    email_new_internship BOOLEAN DEFAULT TRUE,
    email_follow_updates BOOLEAN DEFAULT TRUE,
    email_weekly_digest BOOLEAN DEFAULT TRUE,
    
    -- Browser Notifications
    browser_application_status BOOLEAN DEFAULT TRUE,
    browser_new_applicant BOOLEAN DEFAULT TRUE,
    browser_new_message BOOLEAN DEFAULT TRUE,
    browser_new_internship BOOLEAN DEFAULT TRUE,
    browser_follow_updates BOOLEAN DEFAULT TRUE,
    
    -- Frequency
    email_frequency TEXT DEFAULT 'instant',  -- instant, daily, weekly
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(profile_id);

-- ============================================
-- TOPICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,  -- programming_language, framework, domain, etc.
    follower_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_name ON topics(name);
CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_category ON topics(category);

-- Insert common topics
INSERT INTO topics (name, slug, category, description) VALUES
    ('Python', 'python', 'programming_language', 'Python programming language'),
    ('JavaScript', 'javascript', 'programming_language', 'JavaScript programming language'),
    ('React', 'react', 'framework', 'React.js framework'),
    ('Node.js', 'nodejs', 'framework', 'Node.js runtime'),
    ('Machine Learning', 'machine-learning', 'domain', 'ML and AI development'),
    ('Web Development', 'web-development', 'domain', 'Web development'),
    ('Data Science', 'data-science', 'domain', 'Data science and analytics'),
    ('Mobile Development', 'mobile-development', 'domain', 'Mobile app development'),
    ('DevOps', 'devops', 'domain', 'DevOps and infrastructure'),
    ('Cybersecurity', 'cybersecurity', 'domain', 'Security and cybersecurity')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- USER FOLLOWED TOPICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_followed_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, topic_id)
);

CREATE INDEX idx_followed_topics_user ON user_followed_topics(profile_id);
CREATE INDEX idx_followed_topics_topic ON user_followed_topics(topic_id);

-- ============================================
-- USER FOLLOWED COMPANIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_followed_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, company_id)
);

CREATE INDEX idx_followed_companies_user ON user_followed_companies(profile_id);
CREATE INDEX idx_followed_companies_company ON user_followed_companies(company_id);

-- ============================================
-- INTERNSHIP TOPICS (Junction Table)
-- ============================================

CREATE TABLE IF NOT EXISTS internship_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 1.0,  -- AI-determined relevance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(internship_id, topic_id)
);

CREATE INDEX idx_internship_topics_internship ON internship_topics(internship_id);
CREATE INDEX idx_internship_topics_topic ON internship_topics(topic_id);
CREATE INDEX idx_internship_topics_score ON internship_topics(relevance_score DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences on profile creation
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON profiles;
CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Update follower count for topics
CREATE OR REPLACE FUNCTION update_topic_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE topics
        SET follower_count = follower_count + 1
        WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE topics
        SET follower_count = follower_count - 1
        WHERE id = OLD.topic_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_followers ON user_followed_topics;
CREATE TRIGGER trigger_update_topic_followers
    AFTER INSERT OR DELETE ON user_followed_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_follower_count();

-- Create notification helper function
CREATE OR REPLACE FUNCTION create_notification(
    p_profile_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_prefs RECORD;
    v_should_email BOOLEAN := FALSE;
BEGIN
    -- Insert notification
    INSERT INTO notifications (profile_id, type, title, message, link, metadata)
    VALUES (p_profile_id, p_type, p_title, p_message, p_link, p_metadata)
    RETURNING id INTO v_notification_id;
    
    -- Check if email should be sent
    SELECT * INTO v_prefs
    FROM notification_preferences
    WHERE profile_id = p_profile_id;
    
    IF v_prefs IS NOT NULL THEN
        CASE p_type
            WHEN 'application_status' THEN v_should_email := v_prefs.email_application_status;
            WHEN 'new_applicant' THEN v_should_email := v_prefs.email_new_applicant;
            WHEN 'new_message' THEN v_should_email := v_prefs.email_new_message;
            WHEN 'new_internship' THEN v_should_email := v_prefs.email_new_internship;
            WHEN 'follow_company_post' THEN v_should_email := v_prefs.email_follow_updates;
            WHEN 'follow_topic_match' THEN v_should_email := v_prefs.email_follow_updates;
            ELSE v_should_email := TRUE;
        END CASE;
    END IF;
    
    -- Mark for email if preferences allow
    IF v_should_email AND v_prefs.email_frequency = 'instant' THEN
        UPDATE notifications
        SET is_email_sent = TRUE
        WHERE id = v_notification_id;
    END IF;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Notify on application status change
-- ============================================

CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_student_profile_id UUID;
    v_internship_title TEXT;
    v_company_name TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get student profile ID
        SELECT profile_id INTO v_student_profile_id
        FROM students
        WHERE id = NEW.student_id;
        
        -- Get internship and company details
        SELECT i.title, c.name INTO v_internship_title, v_company_name
        FROM internships i
        JOIN companies c ON i.company_id = c.id
        WHERE i.id = NEW.internship_id;
        
        -- Create notification
        PERFORM create_notification(
            v_student_profile_id,
            'application_status',
            'Application Status Updated',
            format('Your application for %s at %s is now: %s', 
                   v_internship_title, v_company_name, NEW.status),
            format('/student/applications'),
            jsonb_build_object('application_id', NEW.id, 'status', NEW.status)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_application_status ON applications;
CREATE TRIGGER trigger_notify_application_status
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_application_status_change();

-- ============================================
-- TRIGGER: Notify company on new applicant
-- ============================================

CREATE OR REPLACE FUNCTION notify_new_applicant()
RETURNS TRIGGER AS $$
DECLARE
    v_company_profile_id UUID;
    v_student_name TEXT;
    v_internship_title TEXT;
BEGIN
    -- Get company profile ID
    SELECT c.profile_id INTO v_company_profile_id
    FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.id = NEW.internship_id;
    
    -- Get student name and internship title
    SELECT p.display_name, i.title INTO v_student_name, v_internship_title
    FROM students s
    JOIN profiles p ON s.profile_id = p.id
    CROSS JOIN internships i
    WHERE s.id = NEW.student_id AND i.id = NEW.internship_id;
    
    -- Create notification
    PERFORM create_notification(
        v_company_profile_id,
        'new_applicant',
        'New Application Received',
        format('%s applied for %s', v_student_name, v_internship_title),
        format('/company/matches'),
        jsonb_build_object('application_id', NEW.id, 'internship_id', NEW.internship_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_applicant ON applications;
CREATE TRIGGER trigger_notify_new_applicant
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_applicant();

-- ============================================
-- VIEWS
-- ============================================

-- View: User notifications with all details
CREATE OR REPLACE VIEW user_notifications_view AS
SELECT 
    n.id,
    n.profile_id,
    n.type,
    n.title,
    n.message,
    n.link,
    n.is_read,
    n.metadata,
    n.created_at,
    p.display_name as user_name,
    p.email as user_email
FROM notifications n
JOIN profiles p ON n.profile_id = p.id
ORDER BY n.created_at DESC;

-- View: User followed topics with details
CREATE OR REPLACE VIEW user_followed_topics_view AS
SELECT 
    uft.id,
    uft.profile_id,
    uft.topic_id,
    t.name as topic_name,
    t.slug as topic_slug,
    t.category,
    t.follower_count,
    uft.created_at
FROM user_followed_topics uft
JOIN topics t ON uft.topic_id = t.id;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE notifications IS 'Stores all user notifications';
COMMENT ON TABLE notification_preferences IS 'User preferences for email and browser notifications';
COMMENT ON TABLE topics IS 'Available topics users can follow';
COMMENT ON TABLE user_followed_topics IS 'Topics followed by users';
COMMENT ON TABLE user_followed_companies IS 'Companies followed by users';
COMMENT ON TABLE internship_topics IS 'Topics associated with internships (AI-analyzed)';
COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications with preference checking';
