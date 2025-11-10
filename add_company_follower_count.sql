-- Add follower_count column to companies table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'follower_count') THEN
        ALTER TABLE companies ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update company follower count
CREATE OR REPLACE FUNCTION update_company_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE companies
        SET follower_count = follower_count + 1
        WHERE id = NEW.company_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE companies
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.company_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_company_followers ON company_followers;

-- Create trigger for company followers
CREATE TRIGGER trigger_update_company_followers
    AFTER INSERT OR DELETE ON company_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_company_follower_count();

-- Initialize follower counts for existing companies
UPDATE companies c
SET follower_count = (
    SELECT COUNT(*) 
    FROM company_followers cf 
    WHERE cf.company_id = c.id
)
WHERE follower_count = 0 OR follower_count IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_company_followers_company ON company_followers(company_id);
CREATE INDEX IF NOT EXISTS idx_company_followers_student ON company_followers(student_id);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Company follower count system installed!';
    RAISE NOTICE '📊 Features:';
    RAISE NOTICE '   - Auto-updates follower_count on companies table';
    RAISE NOTICE '   - Increments on follow';
    RAISE NOTICE '   - Decrements on unfollow';
    RAISE NOTICE '   - Initialized counts for existing companies';
END $$;
