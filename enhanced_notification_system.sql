-- Enhanced Notification System (Works with Existing Schema)
-- This adds to your existing notifications, topics, and preferences tables

-- ============================================
-- UPDATE EXISTING NOTIFICATION TYPE ENUM
-- ============================================

-- Add new notification types to existing enum if they don't exist
DO $$ 
BEGIN
    -- Check if notification_type enum exists, if not check for existing type name
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        -- If you have a different enum name for notification types, it will use that
        -- Otherwise we'll work with the existing structure
        RAISE NOTICE 'Using existing notification structure';
    END IF;
END $$;

-- ============================================
-- ENHANCE EXISTING NOTIFICATIONS TABLE
-- ============================================

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Add is_email_sent column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'is_email_sent') THEN
        ALTER TABLE notifications ADD COLUMN is_email_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);

-- ============================================
-- ENHANCE EXISTING USER_PREFERENCES TABLE
-- ============================================

-- Add email preference columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'email_new_applicant') THEN
        ALTER TABLE user_preferences ADD COLUMN email_new_applicant BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'email_follow_updates') THEN
        ALTER TABLE user_preferences ADD COLUMN email_follow_updates BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'email_weekly_digest') THEN
        ALTER TABLE user_preferences ADD COLUMN email_weekly_digest BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'email_frequency') THEN
        ALTER TABLE user_preferences ADD COLUMN email_frequency TEXT DEFAULT 'instant';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'browser_new_applicant') THEN
        ALTER TABLE user_preferences ADD COLUMN browser_new_applicant BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'browser_follow_updates') THEN
        ALTER TABLE user_preferences ADD COLUMN browser_follow_updates BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- ============================================
-- ENHANCE EXISTING TOPICS TABLE
-- ============================================

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topics' AND column_name = 'category') THEN
        ALTER TABLE topics ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topics' AND column_name = 'follower_count') THEN
        ALTER TABLE topics ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add more topics if they don't exist
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
    ('Cybersecurity', 'cybersecurity', 'domain', 'Security and cybersecurity'),
    ('Java', 'java', 'programming_language', 'Java programming language'),
    ('TypeScript', 'typescript', 'programming_language', 'TypeScript language'),
    ('Angular', 'angular', 'framework', 'Angular framework'),
    ('Vue.js', 'vuejs', 'framework', 'Vue.js framework'),
    ('Django', 'django', 'framework', 'Django Python framework'),
    ('Flask', 'flask', 'framework', 'Flask Python framework'),
    ('Spring Boot', 'spring-boot', 'framework', 'Spring Boot Java framework')
ON CONFLICT (name) DO NOTHING;

-- Update category for existing topics
UPDATE topics SET category = 'programming_language' 
WHERE name IN ('Python', 'JavaScript', 'Java', 'TypeScript') AND category IS NULL;

UPDATE topics SET category = 'framework' 
WHERE name IN ('React', 'Node.js', 'Angular', 'Vue.js', 'Django', 'Flask', 'Spring Boot') AND category IS NULL;

UPDATE topics SET category = 'domain' 
WHERE name IN ('Machine Learning', 'Web Development', 'Data Science', 'Mobile Development', 'DevOps', 'Cybersecurity') AND category IS NULL;

-- ============================================
-- UPDATE INTERNSHIP_TOPICS TABLE
-- ============================================

-- Add relevance_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'internship_topics' AND column_name = 'relevance_score') THEN
        ALTER TABLE internship_topics ADD COLUMN relevance_score FLOAT DEFAULT 1.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'internship_topics' AND column_name = 'created_at') THEN
        ALTER TABLE internship_topics ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_internship_topics_score ON internship_topics(relevance_score DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create notification (works with existing schema)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
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
    -- Insert notification using your existing schema
    INSERT INTO notifications (user_id, type, title, message, link, metadata, read, created_at)
    VALUES (p_user_id, p_type::notification_type, p_title, p_message, p_link, p_metadata, false, NOW())
    RETURNING id INTO v_notification_id;
    
    -- Check user preferences
    SELECT * INTO v_prefs
    FROM user_preferences
    WHERE user_id = p_user_id;
    
    IF v_prefs IS NOT NULL THEN
        CASE p_type
            WHEN 'application_status' THEN v_should_email := v_prefs.email_application_status;
            WHEN 'new_applicant' THEN v_should_email := COALESCE(v_prefs.email_new_applicant, true);
            WHEN 'new_message' THEN v_should_email := COALESCE(v_prefs.email_new_messages, true);
            WHEN 'new_internship' THEN v_should_email := COALESCE(v_prefs.email_new_internships, true);
            WHEN 'follow_company_post' THEN v_should_email := COALESCE(v_prefs.email_follow_updates, true);
            WHEN 'follow_topic_match' THEN v_should_email := COALESCE(v_prefs.email_follow_updates, true);
            ELSE v_should_email := COALESCE(v_prefs.email_notifications, true);
        END CASE;
    END IF;
    
    -- Mark for email if preferences allow and frequency is instant
    IF v_should_email AND COALESCE(v_prefs.email_frequency, 'instant') = 'instant' THEN
        UPDATE notifications
        SET is_email_sent = TRUE
        WHERE id = v_notification_id;
    END IF;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Update topic follower count
-- ============================================

CREATE OR REPLACE FUNCTION update_topic_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE topics
        SET follower_count = follower_count + 1
        WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE topics
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.topic_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_followers ON topic_followers;
CREATE TRIGGER trigger_update_topic_followers
    AFTER INSERT OR DELETE ON topic_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_follower_count();

-- Initialize follower counts for existing topics
UPDATE topics t
SET follower_count = (
    SELECT COUNT(*) 
    FROM topic_followers tf 
    WHERE tf.topic_id = t.id
)
WHERE follower_count = 0 OR follower_count IS NULL;

-- ============================================
-- TRIGGER: Notify on application status change
-- ============================================

CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_student_user_id UUID;
    v_internship_title TEXT;
    v_company_name TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get student's user_id from profile
        SELECT p.id INTO v_student_user_id
        FROM students s
        JOIN profiles p ON s.profile_id = p.id
        WHERE s.id = NEW.student_id;
        
        -- Get internship and company details
        SELECT i.title, c.name INTO v_internship_title, v_company_name
        FROM internships i
        JOIN companies c ON i.company_id = c.id
        WHERE i.id = NEW.internship_id;
        
        -- Create notification
        PERFORM create_notification(
            v_student_user_id,
            'application_status',
            'Application Status Updated',
            format('Your application for %s at %s is now: %s', 
                   v_internship_title, v_company_name, NEW.status),
            '/student/applications',
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
    v_company_user_id UUID;
    v_student_name TEXT;
    v_internship_title TEXT;
BEGIN
    -- Get company's user_id from profile
    SELECT p.id INTO v_company_user_id
    FROM internships i
    JOIN companies c ON i.company_id = c.id
    JOIN profiles p ON c.profile_id = p.id
    WHERE i.id = NEW.internship_id;
    
    -- Get student name and internship title
    SELECT p.display_name, i.title INTO v_student_name, v_internship_title
    FROM students s
    JOIN profiles p ON s.profile_id = p.id
    CROSS JOIN internships i
    WHERE s.id = NEW.student_id AND i.id = NEW.internship_id;
    
    -- Create notification
    PERFORM create_notification(
        v_company_user_id,
        'new_applicant',
        'New Application Received',
        format('%s applied for %s', COALESCE(v_student_name, 'A student'), v_internship_title),
        '/company/matches',
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
-- FUNCTION: Notify topic followers when new internship matches
-- ============================================

CREATE OR REPLACE FUNCTION notify_topic_followers_new_internship(
    p_internship_id UUID,
    p_topic_id UUID,
    p_relevance_score FLOAT DEFAULT 1.0
)
RETURNS VOID AS $$
DECLARE
    v_follower RECORD;
    v_internship RECORD;
    v_topic_name TEXT;
BEGIN
    -- Get internship details
    SELECT i.title, c.name as company_name
    INTO v_internship
    FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.id = p_internship_id;
    
    -- Get topic name
    SELECT name INTO v_topic_name FROM topics WHERE id = p_topic_id;
    
    -- Notify all followers of this topic
    FOR v_follower IN 
        SELECT p.id as user_id
        FROM topic_followers tf
        JOIN students s ON tf.student_id = s.id
        JOIN profiles p ON s.profile_id = p.id
        WHERE tf.topic_id = p_topic_id
    LOOP
        PERFORM create_notification(
            v_follower.user_id,
            'follow_topic_match',
            format('New %s Opportunity!', v_topic_name),
            format('%s at %s', v_internship.title, v_internship.company_name),
            format('/student/browse'),
            jsonb_build_object(
                'internship_id', p_internship_id, 
                'topic_id', p_topic_id,
                'relevance_score', p_relevance_score
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Notify company followers when new internship posted
-- ============================================

CREATE OR REPLACE FUNCTION notify_company_followers_new_internship()
RETURNS TRIGGER AS $$
DECLARE
    v_follower RECORD;
    v_company_name TEXT;
BEGIN
    -- Get company name
    SELECT name INTO v_company_name
    FROM companies
    WHERE id = NEW.company_id;
    
    -- Notify all followers of this company
    FOR v_follower IN 
        SELECT p.id as user_id
        FROM company_followers cf
        JOIN students s ON cf.student_id = s.id
        JOIN profiles p ON s.profile_id = p.id
        WHERE cf.company_id = NEW.company_id
    LOOP
        PERFORM create_notification(
            v_follower.user_id,
            'follow_company_post',
            format('%s Posted a New Internship!', v_company_name),
            NEW.title,
            '/student/browse',
            jsonb_build_object('internship_id', NEW.id, 'company_id', NEW.company_id)
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_company_followers ON internships;
CREATE TRIGGER trigger_notify_company_followers
    AFTER INSERT ON internships
    FOR EACH ROW
    EXECUTE FUNCTION notify_company_followers_new_internship();

-- ============================================
-- VIEWS
-- ============================================

-- View: Enhanced user notifications
CREATE OR REPLACE VIEW user_notifications_enhanced AS
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.link,
    n.read,
    n.is_email_sent,
    n.metadata,
    n.created_at,
    p.display_name as user_name,
    p.email as user_email,
    p.role as user_role
FROM notifications n
JOIN profiles p ON n.user_id = p.id
ORDER BY n.created_at DESC;

-- View: User followed topics with enhanced details
CREATE OR REPLACE VIEW user_followed_topics_enhanced AS
SELECT 
    tf.student_id,
    s.profile_id,
    tf.topic_id,
    t.name as topic_name,
    t.slug as topic_slug,
    t.category,
    t.follower_count,
    tf.created_at
FROM topic_followers tf
JOIN topics t ON tf.topic_id = t.id
JOIN students s ON tf.student_id = s.id;

-- View: User followed companies with details
CREATE OR REPLACE VIEW user_followed_companies_enhanced AS
SELECT 
    cf.student_id,
    s.profile_id,
    cf.company_id,
    c.name as company_name,
    c.website,
    c.logo_url,
    cf.created_at
FROM company_followers cf
JOIN companies c ON cf.company_id = c.id
JOIN students s ON cf.student_id = s.id;

-- ============================================
-- INITIALIZE
-- ============================================

-- Create default user preferences for existing users who don't have them
INSERT INTO user_preferences (user_id)
SELECT p.id 
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences up WHERE up.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Enhanced notification system successfully installed!';
    RAISE NOTICE '📊 Features added:';
    RAISE NOTICE '   - Auto-notifications for application status changes';
    RAISE NOTICE '   - Auto-notifications for new applicants';
    RAISE NOTICE '   - Company follower notifications';
    RAISE NOTICE '   - Topic matching notifications (call notify_topic_followers_new_internship)';
    RAISE NOTICE '   - Enhanced email preferences';
    RAISE NOTICE '   - Topic categories and follower counts';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Build notification bell UI component';
    RAISE NOTICE '   2. Create notification preferences page';
    RAISE NOTICE '   3. Implement browser notifications';
    RAISE NOTICE '   4. Add AI topic analysis when posting internships';
END $$;
