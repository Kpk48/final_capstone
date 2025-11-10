-- Function to generate contextual company username based on company name
CREATE OR REPLACE FUNCTION generate_company_username(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 1;
    username_exists BOOLEAN;
BEGIN
    -- Sanitize company name to create base username
    base_username := lower(trim(company_name));
    
    -- Replace spaces and special characters with underscore
    base_username := regexp_replace(base_username, '[^a-z0-9]+', '_', 'g');
    
    -- Remove leading/trailing underscores
    base_username := regexp_replace(base_username, '^_+|_+$', '', 'g');
    
    -- Limit to 30 characters
    base_username := substring(base_username, 1, 30);
    
    -- If empty after sanitization, use default
    IF base_username = '' THEN
        base_username := 'company';
    END IF;
    
    -- Check if base username is available
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE username = base_username
    ) INTO username_exists;
    
    IF NOT username_exists THEN
        RETURN base_username;
    END IF;
    
    -- Base username taken, find next available with numeric suffix
    LOOP
        final_username := base_username || '_' || counter;
        
        SELECT EXISTS(
            SELECT 1 FROM public.profiles WHERE username = final_username
        ) INTO username_exists;
        
        IF NOT username_exists THEN
            RETURN final_username;
        END IF;
        
        counter := counter + 1;
        
        -- Safety limit
        IF counter > 9999 THEN
            -- Fallback to random
            RETURN base_username || '_' || substr(md5(random()::text), 1, 5);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate username for companies
CREATE OR REPLACE FUNCTION auto_generate_company_username()
RETURNS TRIGGER AS $$
DECLARE
    company_name TEXT;
    generated_username TEXT;
BEGIN
    -- Only generate if username is NULL
    IF NEW.username IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if this profile has a company
    SELECT name INTO company_name
    FROM public.companies
    WHERE profile_id = NEW.id
    LIMIT 1;
    
    -- If company exists, use company name for username
    IF company_name IS NOT NULL THEN
        generated_username := generate_company_username(company_name);
        NEW.username := generated_username;
    ELSE
        -- Fallback to random username
        NEW.username := 'user_' || substr(md5(random()::text), 1, 5);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT (username generation on profile creation)
DROP TRIGGER IF EXISTS trigger_auto_generate_company_username_insert ON public.profiles;
CREATE TRIGGER trigger_auto_generate_company_username_insert
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_company_username();

-- Create trigger for companies table to update profile username when company is created/updated
CREATE OR REPLACE FUNCTION update_profile_username_from_company()
RETURNS TRIGGER AS $$
DECLARE
    profile_username TEXT;
    new_username TEXT;
BEGIN
    -- Get current profile username
    SELECT username INTO profile_username
    FROM public.profiles
    WHERE id = NEW.profile_id;
    
    -- Only update if username is null or starts with 'user_' (generic)
    IF profile_username IS NULL OR profile_username LIKE 'user_%' THEN
        new_username := generate_company_username(NEW.name);
        
        UPDATE public.profiles
        SET username = new_username
        WHERE id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on companies table
DROP TRIGGER IF EXISTS trigger_update_username_from_company ON public.companies;
CREATE TRIGGER trigger_update_username_from_company
    AFTER INSERT OR UPDATE OF name ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_username_from_company();

-- Backfill: Generate usernames for existing companies without proper usernames
DO $$
DECLARE
    company_record RECORD;
    new_username TEXT;
BEGIN
    FOR company_record IN
        SELECT c.profile_id, c.name, p.username
        FROM public.companies c
        INNER JOIN public.profiles p ON p.id = c.profile_id
        WHERE p.username IS NULL OR p.username LIKE 'user_%'
    LOOP
        new_username := generate_company_username(company_record.name);
        
        UPDATE public.profiles
        SET username = new_username
        WHERE id = company_record.profile_id;
        
        RAISE NOTICE 'Updated company % to username: %', company_record.name, new_username;
    END LOOP;
END $$;
