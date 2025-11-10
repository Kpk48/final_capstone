-- Simple migration to update application_status enum values
-- Run this in your Supabase SQL Editor

-- First, drop the default value
ALTER TABLE public.applications 
  ALTER COLUMN status DROP DEFAULT;

-- Convert the column to text temporarily
ALTER TABLE public.applications 
  ALTER COLUMN status TYPE text;

-- Drop the old enum (now it has no dependencies)
DROP TYPE IF EXISTS public.application_status;

-- Create the new enum with the correct values
CREATE TYPE public.application_status AS ENUM (
  'applied',
  'under_review', 
  'selected',
  'rejected'
);

-- Convert existing values to match new enum
UPDATE public.applications
SET status = CASE 
  WHEN status = 'shortlisted' THEN 'under_review'
  WHEN status = 'hired' THEN 'selected'
  ELSE status
END;

-- Convert the column back to the enum type
ALTER TABLE public.applications 
  ALTER COLUMN status TYPE public.application_status 
  USING status::public.application_status;

-- Set the default value
ALTER TABLE public.applications 
  ALTER COLUMN status SET DEFAULT 'applied'::public.application_status;
