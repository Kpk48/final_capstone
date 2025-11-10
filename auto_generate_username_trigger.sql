-- Function to generate unique username
CREATE OR REPLACE FUNCTION generate_unique_username()
RETURNS TEXT AS $$
DECLARE
    new_username TEXT;
    username_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 5-character string
        new_username := 'user_' || substr(md5(random()::text), 1, 5);
        
        -- Check if username exists
        SELECT EXISTS(
            SELECT 1 FROM public.profiles WHERE username = new_username
        ) INTO username_exists;
        
        -- If username doesn't exist, return it
        IF NOT username_exists THEN
            RETURN new_username;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate username on insert
CREATE OR REPLACE FUNCTION auto_generate_username()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if username is NULL
    IF NEW.username IS NULL THEN
        NEW.username := generate_unique_username();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_username ON public.profiles;
CREATE TRIGGER trigger_auto_generate_username
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_username();

-- Generate usernames for existing profiles that don't have one
UPDATE public.profiles
SET username = generate_unique_username()
WHERE username IS NULL;
