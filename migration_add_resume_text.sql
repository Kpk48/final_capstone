-- Add resume_text column to students table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS resume_text text;

-- Add a comment to document the column
COMMENT ON COLUMN public.students.resume_text IS 'Extracted text from resume PDF for AI matching';
