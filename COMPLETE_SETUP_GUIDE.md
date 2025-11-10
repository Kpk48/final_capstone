# Complete Setup Guide - SkillSync Platform

## 🎯 What's Been Implemented

Your SkillSync platform now has complete profile management for both students and companies with advanced features:

### Student Profile System ✅
- View/Edit mode toggle
- Unique auto-generated usernames (`@user_xxxxx`)
- PDF resume upload with AI text extraction
- Password-protected deletion
- Bio, education, and resume management
- AI-powered internship matching

### Company Profile System ✅
- View/Edit mode toggle
- **Contextual usernames** based on company name
  - "Google" → `@google`
  - "Google" (duplicate) → `@google_1`
- Password-protected deletion
- Logo, website, and description
- Complete profile management

### Application System ✅
- Companies can select/reject candidates
- Seat management (openings decrease on selection)
- Application status tracking
- Students see application status with match scores

## 📋 Required Setup Steps

### 1. Database Migrations

Run these SQL scripts **in this order** in your Supabase SQL Editor:

#### A. Username Columns (If not done)
```bash
File: add_username_column.sql
```
- Adds `username` column to profiles table
- Creates index for fast lookups

#### B. Student Username Triggers
```bash
File: auto_generate_username_trigger.sql
```
- Auto-generates `@user_xxxxx` for students
- Updates existing students without usernames

#### C. Company Username Triggers
```bash
File: company_username_trigger.sql
```
- Auto-generates contextual usernames for companies
- Based on company name (e.g., "Google" → `@google`)
- Handles duplicates with numeric suffixes

#### D. Application Status Enum
```bash
File: update_application_status_enum.sql
```
- Updates enum: `('applied', 'under_review', 'selected', 'rejected')`
- Migrates existing data

#### E. Bio and Storage Setup
```bash
File: add_bio_and_storage.sql
```
- Adds `bio` column to students table
- Contains storage policies for resumes (see step 2)

### 2. Supabase Storage Setup

#### Create Resume Bucket

**Supabase Dashboard → Storage → New Bucket**

Settings:
- **Name**: `resumes`
- **Public**: ✅ Checked
- **File size limit**: `5242880` (5MB)
- **Allowed MIME types**: `application/pdf`

#### Apply Storage Policies

After creating bucket, run the storage policy SQL from `add_bio_and_storage.sql`:
```sql
-- INSERT policy
CREATE POLICY "Users can upload their own resumes"...

-- SELECT policy  
CREATE POLICY "Public can view resumes"...

-- UPDATE policy
CREATE POLICY "Users can update their own resumes"...

-- DELETE policy
CREATE POLICY "Users can delete their own resumes"...
```

### 3. Environment Variables

Verify these are set in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Features (Optional - for resume matching)
GEMINI_API_KEY=your_gemini_api_key

# Site URL (for resume upload)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. NPM Dependencies

Already installed:
```json
{
  "pdf-parse": "^1.1.1",
  "@types/pdf-parse": "^1.1.4",
  "sonner": "^2.0.7"
}
```

## 🧪 Testing Instructions

### Test Student Profile

1. **Register as Student**
   - Go to `/register`
   - Select "Student" role
   - Register with email/password

2. **View Profile**
   - Navigate to `/student/profile`
   - See auto-generated username (`@user_xxxxx`)
   - View empty profile fields

3. **Edit Profile**
   - Click Edit button (pencil icon)
   - Fill in: Name, University, Degree, Year, Bio
   - Upload PDF resume
   - See: "Resume uploaded! Extracted XXX characters"
   - Click Save

4. **Verify Resume Extraction**
   - Resume text should be auto-populated (hidden from view)
   - Green checkmark: "Resume uploaded & processed"
   - Character count displayed

5. **Test Deletion**
   - Click "Delete Profile"
   - Modal appears
   - Try empty password → Error
   - Try wrong password → "Incorrect password"
   - Enter correct password → Profile deleted
   - Verify redirect to homepage

### Test Company Profile

1. **Register as Company**
   - Go to `/register`
   - Select "Company" role  
   - Enter company name (e.g., "Google")
   - Register

2. **Check Username**
   - Go to `/company/profile`
   - See contextual username: `@google`
   - Or `@google_1` if duplicate

3. **Edit Profile**
   - Click Edit button
   - Update: Name, Website, Logo URL, Description
   - Click Save

4. **Test Duplicate Names**
   - Register another company with same name
   - Verify it gets `@google_1`, `@google_2`, etc.

5. **Test Deletion**
   - Click "Delete Profile"
   - Enter password
   - Verify deletion and redirect

### Test Application System

1. **Company Posts Internship**
   - Navigate to `/company/internships/new`
   - Create internship with openings (e.g., 3)
   - Submit

2. **Student Applies**
   - As student, browse internships
   - Apply with cover letter

3. **Company Views Applications**
   - Go to `/company/matches`
   - Select internship
   - See applicants with status badges
   - See match scores

4. **Update Application Status**
   - Click "Under Review" → Status changes
   - Click "Select" → Status updates, openings decrease
   - Verify openings count updates (3 → 2)

5. **Student Views Status**
   - As student, go to `/student/applications`
   - See application with updated status
   - Click application to see details
   - See AI match score

## 📊 Feature Matrix

| Feature | Student | Company | Status |
|---------|---------|---------|--------|
| Unique Username | `@user_xxxxx` | `@company_name` | ✅ |
| View/Edit Mode | ✅ | ✅ | ✅ |
| Password Delete | ✅ | ✅ | ✅ |
| PDF Upload | ✅ Resume | ❌ | ✅ |
| AI Text Extract | ✅ | ❌ | ✅ |
| Bio Field | ✅ | ❌ | ✅ |
| Logo/Website | ❌ | ✅ | ✅ |
| Applications | View own | Manage received | ✅ |
| Match Scores | View | View | ✅ |

## 🎨 UI Improvements Made

### Spacing & Layout
- Increased section spacing (`space-y-8`)
- Better label spacing (`mb-2`)
- Consistent input height (`h-11`)
- Improved padding (`px-4 py-3`)
- No more text overlap

### Components
- Username badge with copy button
- Status badges with color coding
- Toast notifications for all actions
- Loading states throughout
- Responsive design

## 🔐 Security Features

### Password-Protected Deletion
- Modal confirmation required
- Password field validation
- Backend password verification via Supabase Auth
- Clear error messages
- State cleanup on cancel

### Data Protection
- RLS policies on Supabase
- Cascade deletions properly configured
- Storage policies for resume access
- Role-based access control

## 📁 Files Changed/Created

### Backend APIs
```
✅ /api/student/profile (GET, POST, DELETE)
✅ /api/student/resume-upload (POST)
✅ /api/company/profile (GET, POST, DELETE)
✅ /api/applications/status (POST)
✅ /api/student/applications (GET)
✅ /api/recommendations/internship (GET) - Updated
```

### Frontend Pages
```
✅ /student/profile/page.tsx - Complete rewrite
✅ /company/profile/page.tsx - Complete rewrite
✅ /student/applications/page.tsx - Created
✅ /company/matches/page.tsx - Updated
```

### Utilities
```
✅ /lib/generateUsername.ts
✅ /lib/generateCompanyUsername.ts
```

### SQL Migrations
```
✅ add_username_column.sql
✅ auto_generate_username_trigger.sql
✅ company_username_trigger.sql
✅ update_application_status_enum.sql
✅ add_bio_and_storage.sql
```

### Documentation
```
✅ SETUP_STUDENT_PROFILE.md
✅ PDF_AI_MATCHING.md
✅ PASSWORD_PROTECTED_DELETION.md
✅ COMPANY_PROFILE_SYSTEM.md
✅ COMPLETE_SETUP_GUIDE.md
```

## 🚀 Quick Start Checklist

- [ ] Run all SQL migrations in order
- [ ] Create `resumes` storage bucket
- [ ] Apply storage policies
- [ ] Set environment variables
- [ ] Restart development server
- [ ] Test student registration
- [ ] Test company registration
- [ ] Test resume upload
- [ ] Test application flow
- [ ] Test profile deletion
- [ ] Verify username generation

## 🎯 Key Features Summary

### Automatic Username Generation
- **Students**: Random `@user_xxxxx`
- **Companies**: Contextual `@company_name` with duplicate handling
- **Permanent**: Never changes after creation
- **Unique**: Database constraint ensures no duplicates

### Profile Management
- **View Mode**: Clean, read-only display
- **Edit Mode**: Easy updates with save/cancel
- **Validation**: Required fields and format checks
- **Feedback**: Toast notifications for all actions

### Resume System
- **PDF Upload**: Drag-drop or click to select
- **AI Extraction**: Automatic text extraction from PDF
- **Embeddings**: Auto-generated for AI matching
- **Storage**: Secure Supabase storage with RLS

### Application System
- **Status Tracking**: applied → under_review → selected/rejected
- **Seat Management**: Openings decrease on selection
- **Match Scores**: AI-powered relevance scores
- **Notifications**: Real-time updates via toasts

### Security
- **Password Deletion**: Required for both student and company
- **Backend Verification**: Supabase Auth integration
- **Cascade Deletes**: Proper cleanup of related data
- **Session Protection**: Active session alone isn't enough

## 🎉 What You've Built

A production-ready internship platform with:

1. ✅ **Smart Profiles**: Auto-generated usernames, view/edit modes
2. ✅ **AI Matching**: PDF text extraction, semantic search
3. ✅ **Application Management**: Full workflow with status tracking
4. ✅ **Security**: Password-protected deletions, RLS policies
5. ✅ **Great UX**: Toast notifications, loading states, responsive design
6. ✅ **Scalable**: Database triggers, proper indexing, optimized queries

## 📞 Support

If you encounter issues:

1. Check console for detailed errors
2. Verify all SQL migrations ran successfully
3. Confirm storage bucket and policies are set
4. Check environment variables
5. Review documentation files for specific features

## 🔄 Next Steps (Optional Enhancements)

- Email notifications for application updates
- Company logo upload (like resume upload)
- Advanced search and filters
- Analytics dashboard
- Real-time notifications
- Chat between companies and students
- Interview scheduling
- Multiple resume versions

---

**Your SkillSync platform is now complete and production-ready!** 🚀✨
