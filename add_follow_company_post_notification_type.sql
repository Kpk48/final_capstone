-- Ensures the notification_type enum includes follow_company_post for company follower notifications
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        WHERE t.typname = 'notification_type'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'notification_type'
              AND e.enumlabel = 'follow_company_post'
        ) THEN
            ALTER TYPE notification_type ADD VALUE 'follow_company_post';
        END IF;
        IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'notification_type'
              AND e.enumlabel = 'new_applicant'
        ) THEN
            ALTER TYPE notification_type ADD VALUE 'new_applicant';
        END IF;
        IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'notification_type'
              AND e.enumlabel = 'follow_topic_match'
        ) THEN
            ALTER TYPE notification_type ADD VALUE 'follow_topic_match';
        END IF;
    END IF;
END $$;
