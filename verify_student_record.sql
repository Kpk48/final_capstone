-- Verify Student Record was Created
-- Run this to check if your student record exists

SELECT 
  p.id as profile_id,
  p.email,
  p.role,
  p.display_name,
  s.id as student_id,
  s.resume_url,
  s.bio,
  CASE 
    WHEN s.id IS NULL THEN '❌ NO STUDENT RECORD - Run the fix SQL!'
    WHEN s.resume_url IS NULL THEN '⚠️ STUDENT EXISTS BUT NO RESUME - Upload resume in profile'
    ELSE '✅ ALL GOOD - Can apply to internships'
  END as status
FROM profiles p
LEFT JOIN students s ON s.profile_id = p.id
WHERE p.id = 'fbc39b36-aa74-4076-98ba-9a3cd2b94834'
   OR p.email = (SELECT email FROM auth.users WHERE id = auth.uid());
