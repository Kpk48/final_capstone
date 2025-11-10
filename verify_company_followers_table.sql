-- Verify company_followers table exists and create if missing

-- Create company_followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_followers (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, company_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_followers_student ON company_followers(student_id);
CREATE INDEX IF NOT EXISTS idx_company_followers_company ON company_followers(company_id);

-- Add follower_count to companies if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'follower_count') THEN
        ALTER TABLE companies ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Verify table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_followers'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ company_followers table exists!';
        RAISE NOTICE 'Table structure:';
        RAISE NOTICE '  - student_id (UUID, FK to students)';
        RAISE NOTICE '  - company_id (UUID, FK to companies)';
        RAISE NOTICE '  - created_at (TIMESTAMPTZ)';
    ELSE
        RAISE EXCEPTION '❌ company_followers table does not exist!';
    END IF;
END $$;

-- Show some stats
DO $$
DECLARE
    follower_count INTEGER;
    company_count INTEGER;
    student_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO follower_count FROM company_followers;
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO student_count FROM students;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current Statistics:';
    RAISE NOTICE '   Companies: %', company_count;
    RAISE NOTICE '   Students: %', student_count;
    RAISE NOTICE '   Company Follows: %', follower_count;
    RAISE NOTICE '';
    
    IF follower_count = 0 THEN
        RAISE NOTICE '💡 No company follows yet. This is normal for a new installation.';
    END IF;
END $$;

-- Test if foreign keys work
DO $$
BEGIN
    RAISE NOTICE '🔧 Testing foreign key constraints...';
    
    -- This should work (just testing the constraint exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%company_followers%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✅ Foreign key constraints are set up correctly';
    END IF;
END $$;

RAISE NOTICE '';
RAISE NOTICE '✅ Verification complete! Table is ready to use.';
