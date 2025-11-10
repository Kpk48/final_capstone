-- Fix Missing Student and Company Records
-- This script creates missing student/company records for existing profiles
-- No special permissions required - safe to run anytime

-- ============================================
-- FIX: Create missing student records
-- ============================================

-- Create student records for profiles with role='student' but no student record
INSERT INTO public.students (profile_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.students s ON s.profile_id = p.id
WHERE p.role = 'student' 
  AND s.id IS NULL;

-- ============================================
-- FIX: Create missing company records
-- ============================================

-- Create company records for profiles with role='company' but no company record
INSERT INTO public.companies (profile_id, name)
SELECT p.id, COALESCE(p.display_name, 'Unnamed Company')
FROM public.profiles p
LEFT JOIN public.companies c ON c.profile_id = p.id
WHERE p.role = 'company' 
  AND c.id IS NULL;

-- ============================================
-- VERIFY: Check the results
-- ============================================

-- Check students
SELECT 
  'Students' as record_type,
  COUNT(*) as total_profiles,
  COUNT(s.id) as has_student_record,
  COUNT(*) - COUNT(s.id) as missing_records
FROM public.profiles p
LEFT JOIN public.students s ON s.profile_id = p.id
WHERE p.role = 'student'

UNION ALL

-- Check companies
SELECT 
  'Companies' as record_type,
  COUNT(*) as total_profiles,
  COUNT(c.id) as has_company_record,
  COUNT(*) - COUNT(c.id) as missing_records
FROM public.profiles p
LEFT JOIN public.companies c ON c.profile_id = p.id
WHERE p.role = 'company';
