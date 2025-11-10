-- Automatic User Profile Creation Trigger
-- This trigger automatically creates profile and student/company records when a user signs up

-- ============================================
-- FUNCTION: Auto-create profile and role-specific record
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile_id UUID;
  user_role TEXT;
  user_display_name TEXT;
BEGIN
  -- Extract role and display_name from user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');

  -- Create profile record
  INSERT INTO public.profiles (auth_user_id, email, display_name, role)
  VALUES (NEW.id, NEW.email, user_display_name, user_role)
  RETURNING id INTO new_profile_id;

  -- Create role-specific record
  IF user_role = 'student' THEN
    -- Create student record
    INSERT INTO public.students (profile_id)
    VALUES (new_profile_id);
    
  ELSIF user_role = 'company' THEN
    -- Create company record
    INSERT INTO public.companies (profile_id, name)
    VALUES (new_profile_id, COALESCE(user_display_name, 'Unnamed Company'));
    
  ELSIF user_role = 'admin' THEN
    -- Admin doesn't need a separate record, just the profile
    NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Execute on new user signup
-- ============================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIX EXISTING USERS (One-time migration)
-- ============================================

-- This will create missing student/company records for existing users
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Loop through all profiles
  FOR profile_record IN 
    SELECT p.id, p.role, p.display_name
    FROM public.profiles p
  LOOP
    -- Check if student record exists for student role
    IF profile_record.role = 'student' THEN
      INSERT INTO public.students (profile_id)
      SELECT profile_record.id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.students WHERE profile_id = profile_record.id
      );
    END IF;

    -- Check if company record exists for company role
    IF profile_record.role = 'company' THEN
      INSERT INTO public.companies (profile_id, name)
      SELECT profile_record.id, COALESCE(profile_record.display_name, 'Unnamed Company')
      WHERE NOT EXISTS (
        SELECT 1 FROM public.companies WHERE profile_id = profile_record.id
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Migration complete: Created missing student/company records';
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and role-specific records (student/company) when a new user signs up';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers profile and role record creation on user signup';
