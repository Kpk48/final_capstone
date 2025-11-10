# Search and Profile Visibility System

## 🎯 Overview

Comprehensive search system allowing users to find and view profiles of students and companies with privacy controls.

## ✨ Key Features

### 1. **Profile Visibility Control**
Students can choose to make their profile public or private:
- **Public Profile**: Full details visible including resume, education, bio
- **Private Profile**: Only username visible, all other details hidden
- **Companies**: Always public (enforced by database trigger)

### 2. **Advanced Search**
- Search by username or display name
- Filter by type (All, Students, Companies)
- Fuzzy text matching with PostgreSQL trigram indexing
- Real-time search results
- Visual indicators for public/private profiles

### 3. **Public Profile Pages**
- Unique URL for each user: `/profile/[username]`
- Different views for students vs companies
- Company profiles show all posted internships
- Apply to internships directly from company profile

### 4. **Company Discovery**
- Companies can search other companies
- View competitor profiles
- See what internships others are posting
- All company details always visible

## 📊 Profile Visibility Matrix

| Profile Type | Public Setting | Visible Info |
|--------------|---------------|--------------|
| Student | Public | Username, Name, University, Degree, Year, Bio, Resume |
| Student | Private | Username only |
| Company | Always Public | Username, Name, Website, Logo, Description, Internships |

## 🔧 Implementation Details

### Database Schema

#### Added Field: `is_public`
```sql
ALTER TABLE profiles ADD COLUMN is_public boolean DEFAULT false;
```

#### Indexes for Fast Search
```sql
-- Trigram indexes for fuzzy search
CREATE INDEX idx_profiles_username_search 
  ON profiles USING gin(username gin_trgm_ops);

CREATE INDEX idx_profiles_display_name_search 
  ON profiles USING gin(display_name gin_trgm_ops);

-- Combined search index
CREATE INDEX idx_profiles_search 
  ON profiles(role, is_public, username, display_name);
```

#### Trigger: Companies Always Public
```sql
CREATE FUNCTION ensure_company_public() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'company' THEN
        NEW.is_public := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_company_public
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_company_public();
```

### API Endpoints

#### 1. Search API
**Endpoint**: `GET /api/search/users`

**Parameters**:
- `q` (required): Search query (min 2 characters)
- `type` (optional): `all`, `student`, `company` (default: `all`)

**Response**:
```json
{
  "results": [
    {
      "id": "uuid",
      "username": "google",
      "display_name": "Google Inc.",
      "role": "company",
      "is_public": true,
      "company": {
        "name": "Google Inc.",
        "website": "https://google.com",
        "description": "...",
        "logo_url": "..."
      }
    }
  ]
}
```

**Privacy Logic**:
- Public students: Returns full details
- Private students: Returns `{ private: true }`
- Companies: Always returns full details

#### 2. Public Profile API
**Endpoint**: `GET /api/public/profile/[username]`

**Response for Public Student**:
```json
{
  "username": "user_abc123",
  "display_name": "John Doe",
  "role": "student",
  "is_public": true,
  "student": {
    "university": "MIT",
    "degree": "Computer Science",
    "graduation_year": 2025,
    "bio": "...",
    "resume_url": "...",
    "resume_text": "..."
  }
}
```

**Response for Private Student**:
```json
{
  "username": "user_abc123",
  "display_name": "John Doe",
  "role": "student",
  "is_public": false,
  "private": true,
  "student": {
    "private": true,
    "message": "This profile is private"
  }
}
```

**Response for Company**:
```json
{
  "username": "google",
  "display_name": "Google Inc.",
  "role": "company",
  "is_public": true,
  "company": {
    "name": "Google Inc.",
    "website": "https://google.com",
    "description": "...",
    "logo_url": "..."
  },
  "internships": [
    {
      "id": "uuid",
      "title": "Software Engineer Intern",
      "description": "...",
      "location": "Remote",
      "stipend": 50000,
      "duration": "3 months",
      "openings": 5,
      "skills": ["React", "Node.js"]
    }
  ]
}
```

### Frontend Components

#### 1. Search Page (`/search`)
**Features**:
- Search input with live search
- Type filters (All/Students/Companies)
- Result cards with preview info
- Visual indicators (Eye/EyeOff icons)
- Click to view full profile

#### 2. Public Profile Page (`/profile/[username]`)
**Student View**:
- Header with username and visibility indicator
- Bio section
- Education details (University, Degree, Year)
- Resume download button (if public)
- Private message if profile is private

**Company View**:
- Company logo and name
- Website link
- Company description
- **All posted internships** with:
  - Title, location, stipend, duration
  - Openings count
  - Skills required
  - **Apply button** (redirects to browse page with internship pre-selected)

#### 3. Student Profile Visibility Toggle
**UI Component**:
```tsx
<div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-5">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <Label className="text-sm text-blue-200 flex items-center gap-2 mb-2">
        {isPublic ? <Eye /> : <EyeOff />}
        Profile Visibility
      </Label>
      <p className="text-xs text-blue-200/60">
        {isPublic 
          ? "Your profile is visible to everyone..." 
          : "Your profile is private..."}
      </p>
    </div>
    <Button onClick={() => setIsPublic(!isPublic)}>
      {isPublic ? 'Public' : 'Private'}
    </Button>
  </div>
</div>
```

## 🎨 User Experience

### Student Workflow

#### Making Profile Public
1. Go to `/student/profile`
2. Click "Edit"
3. Toggle "Profile Visibility" to "Public"
4. Click "Save Changes"
5. ✅ Profile now visible in search results with full details

#### Making Profile Private
1. Go to `/student/profile`
2. Click "Edit"
3. Toggle "Profile Visibility" to "Private"
4. Click "Save Changes"
5. ✅ Profile now shows only username in search results

### Company Workflow

#### Viewing Own Profile
1. Go to `/company/profile`
2. See company details
3. Note: Always public (toggle not available)

#### Searching for Talent
1. Click "Search" in navigation
2. Select "Students" filter
3. Search by name or username
4. Click result to view full profile (if public)
5. See student's resume and details

#### Viewing Other Companies
1. Click "Search" in navigation
2. Select "Companies" filter
3. Search for company
4. View company profile with all internships
5. See what positions competitors are offering

### General User Workflow

#### Searching
1. Navigate to `/search`
2. Type username or name (min 2 characters)
3. Select filter (All/Students/Companies)
4. Click search or press Enter
5. Browse results with preview info
6. Click any result to view full profile

#### Viewing Public Profiles
1. Get profile URL: `/profile/[username]`
2. View details based on privacy settings
3. For companies: See all internships
4. Click "Apply" on internships (redirects to browse)

## 🔒 Privacy & Security

### Privacy Rules
1. **Students Control Visibility**: Can toggle public/private
2. **Companies Always Public**: Cannot hide profile
3. **Username Always Visible**: Even in private profiles
4. **Resume Protection**: Only visible if profile is public
5. **Default Privacy**: Students default to private (`is_public = false`)

### Database Enforcement
```sql
-- Companies cannot be private
CREATE TRIGGER trigger_ensure_company_public
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_company_public();
```

### API Protection
- Search API filters results by `is_public` flag
- Public profile API checks privacy before returning data
- No direct database access from frontend
- All queries go through backend APIs

## 📈 Performance Optimizations

### Database Indexes
```sql
-- Fast visibility checks
CREATE INDEX idx_profiles_is_public ON profiles(is_public);

-- Trigram search (fuzzy matching)
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_profiles_username_search 
  ON profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_profiles_display_name_search 
  ON profiles USING gin(display_name gin_trgm_ops);

-- Combined multi-column index
CREATE INDEX idx_profiles_search 
  ON profiles(role, is_public, username, display_name);
```

### Query Optimization
- LIMIT 20 on search results
- Indexed WHERE clauses
- Selective field fetching
- Batch loading of related data

### Frontend Optimization
- Debounced search input (could be added)
- Loading states
- Error boundaries
- Lazy loading of profiles

## 🎯 Use Cases

### 1. Student Job Search
**Scenario**: Student wants to network with other students at target companies
- Search for students
- Filter public profiles only
- View their education and resume
- Connect based on shared interests

### 2. Company Recruitment
**Scenario**: Company wants to find candidates
- Search for students with specific skills
- View public profiles
- Check resume and qualifications
- Contact for opportunities

### 3. Company Research
**Scenario**: Company wants to see competition
- Search for other companies
- View their profiles
- See what internships they're offering
- Competitive analysis

### 4. Privacy-Conscious Student
**Scenario**: Student wants to control visibility
- Keep profile private by default
- Make public when actively job hunting
- Hide when not looking for opportunities
- Control who sees resume

## 🧪 Testing Checklist

### Profile Visibility
- [ ] Student can toggle visibility
- [ ] Save persists visibility setting
- [ ] Companies always show as public
- [ ] Private profiles hide details in search
- [ ] Public profiles show full details

### Search Functionality
- [ ] Search by username works
- [ ] Search by display name works
- [ ] Fuzzy matching works (typos)
- [ ] Type filters work (All/Student/Company)
- [ ] Results show correct visibility icons
- [ ] Click result navigates to profile

### Public Profile Pages
- [ ] Student public profile shows all details
- [ ] Student private profile shows limited info
- [ ] Company profile shows all details
- [ ] Company profile lists all internships
- [ ] Apply button works on internships
- [ ] Resume download works
- [ ] 404 for non-existent usernames

### Database Triggers
- [ ] New company profile sets is_public=true
- [ ] Company visibility cannot be set to false
- [ ] Student defaults to is_public=false
- [ ] Indexes improve search performance

## 📁 Files Created/Modified

### SQL Migration
```
✅ add_profile_visibility.sql
```

### Backend APIs
```
✅ /api/search/users/route.ts - Search endpoint
✅ /api/public/profile/[username]/route.ts - Public profile endpoint
✅ /api/student/profile/route.ts - Updated with is_public
```

### Frontend Pages
```
✅ /search/page.tsx - Search interface
✅ /profile/[username]/page.tsx - Public profile view
✅ /student/profile/page.tsx - Updated with visibility toggle
```

### Components
```
✅ src/components/Header.tsx - Added Search link
```

## 🚀 Setup Instructions

### 1. Run SQL Migration
```sql
-- Execute add_profile_visibility.sql in Supabase SQL Editor
```

This will:
- Add `is_public` column to profiles
- Create search indexes
- Enable pg_trgm extension
- Set up company public trigger
- Set all existing companies to public

### 2. Test Search
1. Go to `/search`
2. Search for a username
3. Verify results appear
4. Click a result to view profile

### 3. Test Visibility Toggle
1. Login as student
2. Go to `/student/profile`
3. Click Edit
4. Toggle visibility
5. Save and verify

### 4. Test Company Profile
1. Login as company
2. Note you cannot change visibility
3. Post an internship
4. Search for your company as another user
5. Verify internships appear on profile

## 🎉 Summary

Your platform now has:

1. ✅ **Privacy Controls**: Students control visibility
2. ✅ **Advanced Search**: Find users by name/username
3. ✅ **Public Profiles**: Shareable profile URLs
4. ✅ **Company Discovery**: View competitor profiles
5. ✅ **Internship Listings**: Apply from company profiles
6. ✅ **Performance**: Indexed for fast searches
7. ✅ **Security**: Database-enforced privacy rules

Users can now discover each other, companies can showcase their opportunities, and students have full control over their privacy! 🔍✨
