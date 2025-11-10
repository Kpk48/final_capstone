-- Add bio column to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS bio text;

-- Create storage bucket for resumes (run this in Supabase dashboard under Storage)
-- This creates a public bucket that anyone can read but only authenticated users can upload to

-- Note: You need to manually create the 'resumes' bucket in Supabase Dashboard -> Storage
-- Then set these policies:

-- Storage policies for resumes bucket (run after creating bucket):
-- Allow authenticated users to upload their own resumes
-- INSERT policy
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] IN (
  SELECT s.id::text FROM students s
  INNER JOIN profiles p ON p.id = s.profile_id
  WHERE p.auth_user_id = auth.uid()
));

-- Allow public read access
CREATE POLICY "Public can view resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Allow users to update their own resumes
CREATE POLICY "Users can update their own resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] IN (
  SELECT s.id::text FROM students s
  INNER JOIN profiles p ON p.id = s.profile_id
  WHERE p.auth_user_id = auth.uid()
));

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] IN (
  SELECT s.id::text FROM students s
  INNER JOIN profiles p ON p.id = s.profile_id
  WHERE p.auth_user_id = auth.uid()
));
