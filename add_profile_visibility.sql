-- Enable pg_trgm extension for fuzzy search (MUST be first!)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add profile visibility field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.profiles.is_public IS 'Whether profile is visible to public. Companies are always public, students can choose.';

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_search ON public.profiles USING gin(display_name gin_trgm_ops);

-- Set all companies to public by default
UPDATE public.profiles
SET is_public = true
WHERE role = 'company';

-- Function to ensure companies are always public
CREATE OR REPLACE FUNCTION ensure_company_public()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'company' THEN
        NEW.is_public := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce companies are always public
DROP TRIGGER IF EXISTS trigger_ensure_company_public ON public.profiles;
CREATE TRIGGER trigger_ensure_company_public
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_company_public();

-- Add index for combined search
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON public.profiles(role, is_public, username, display_name);
