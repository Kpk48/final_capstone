-- Align the conversations table with application triggers used by the app
-- Adds missing columns (company_id, student_id) and ensures helper trigger exists.

-- Add company_id column if it is missing
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add student_id column if it is missing
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Ensure UNIQUE constraint on application_id (one conversation per application)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'conversations'::regclass
          AND conname = 'conversations_application_id_key'
    ) THEN
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_application_id_key UNIQUE (application_id);
    END IF;
END $$;

-- Helpful indexes for lookups (idempotent thanks to IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_conversations_company ON conversations(company_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations(student_id, last_message_at DESC);

-- Recreate trigger function that seeds a conversation whenever an application is inserted
CREATE OR REPLACE FUNCTION create_conversation_for_application()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_company_profile_id UUID;
    v_student_profile_id UUID;
    v_participant1 UUID;
    v_participant2 UUID;
BEGIN
    SELECT company_id INTO v_company_id
    FROM internships
    WHERE id = NEW.internship_id;

    IF v_company_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT profile_id INTO v_company_profile_id
    FROM companies
    WHERE id = v_company_id;

    SELECT profile_id INTO v_student_profile_id
    FROM students
    WHERE id = NEW.student_id;

    IF v_company_profile_id IS NULL OR v_student_profile_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_company_profile_id < v_student_profile_id THEN
        v_participant1 := v_company_profile_id;
        v_participant2 := v_student_profile_id;
    ELSE
        v_participant1 := v_student_profile_id;
        v_participant2 := v_company_profile_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM conversations
        WHERE participant1_profile_id = v_participant1
          AND participant2_profile_id = v_participant2
    ) THEN
        UPDATE conversations
        SET
            application_id = COALESCE(application_id, NEW.id),
            company_id = v_company_id,
            student_id = NEW.student_id
        WHERE participant1_profile_id = v_participant1
          AND participant2_profile_id = v_participant2;
    ELSE
        INSERT INTO conversations (
            application_id,
            company_id,
            student_id,
            participant1_profile_id,
            participant2_profile_id
        )
        VALUES (
            NEW.id,
            v_company_id,
            NEW.student_id,
            v_participant1,
            v_participant2
        )
        ON CONFLICT (application_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_conversation_on_application ON applications;
CREATE TRIGGER create_conversation_on_application
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_for_application();
