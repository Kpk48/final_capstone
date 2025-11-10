-- Migration: Update application_status enum to support new workflow
-- This updates the enum from (applied, shortlisted, rejected, hired)
-- to (applied, under_review, selected, rejected)

-- Step 1: Add new enum type with updated values
CREATE TYPE public.application_status_new AS ENUM ('applied', 'under_review', 'selected', 'rejected');

-- Step 2: Update the applications table to use the new enum
ALTER TABLE public.applications 
  ALTER COLUMN status TYPE public.application_status_new 
  USING (
    CASE status::text
      WHEN 'applied' THEN 'applied'::public.application_status_new
      WHEN 'shortlisted' THEN 'under_review'::public.application_status_new
      WHEN 'hired' THEN 'selected'::public.application_status_new
      WHEN 'rejected' THEN 'rejected'::public.application_status_new
      ELSE 'applied'::public.application_status_new
    END
  );

-- Step 3: Drop the old enum type
DROP TYPE public.application_status;

-- Step 4: Rename new enum to original name
ALTER TYPE public.application_status_new RENAME TO application_status;
