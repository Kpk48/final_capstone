# 🔧 Follow Companies - Troubleshooting Guide

## Issue: "Cannot follow companies"

Let's diagnose and fix this step by step:

---

## ✅ Step 1: Verify Database Table Exists

Run this in Supabase SQL Editor:

```sql
-- Run this file:
\i verify_company_followers_table.sql
```

This will:
- Check if `company_followers` table exists
- Show table structure
- Display current statistics

**Expected output:**
```
✅ company_followers table exists!
📊 Current Statistics:
   Companies: X
   Students: Y
   Company Follows: 0
```

---

## ✅ Step 2: Check if You're Logged In as Student

The follow feature only works for **students**, not companies or admins.

### Test:
1. Go to your app
2. Open browser console (F12)
3. Run:
```javascript
fetch('/api/me')
  .then(r => r.json())
  .then(d => console.log('Role:', d.profile?.role));
```

**Expected:** `Role: student`

**If not student:** Log out and log in as a student account.

---

## ✅ Step 3: Verify Browse Page Shows Follow Buttons

The follow buttons should appear on `/student/browse` page.

### What you should see:

```
┌─────────────────────────────────────┐
│ Python Developer           [Apply]  │
│ TechCorp  [Follow] 👥 0            │  ← This button!
│                                     │
│ Topics shown here...                │
└─────────────────────────────────────┘
```

### If button is missing:

1. **Check browser console for errors:**
   - Press F12
   - Look for red errors
   - Share them if you see any

2. **Check if company data is loaded:**
   ```javascript
   // In browser console
   fetch('/api/internships/list')
     .then(r => r.json())
     .then(d => console.log('Companies:', d.map(i => i.company)));
   ```

---

## ✅ Step 4: Test Follow API Directly

### Test in browser console:

```javascript
// Get a company ID first
fetch('/api/internships/list')
  .then(r => r.json())
  .then(data => {
    const companyId = data[0]?.company?.id;
    console.log('Testing with company ID:', companyId);
    
    // Try to follow
    return fetch('/api/companies/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId })
    });
  })
  .then(r => r.json())
  .then(result => console.log('Follow result:', result))
  .catch(err => console.error('Error:', err));
```

### Expected responses:

**Success:**
```json
{ "message": "Company followed successfully" }
```

**Already following:**
```json
{ "message": "Already following this company" }
```

**Error - Not a student:**
```json
{ "error": "Student profile not found" }
```

---

## ✅ Step 5: Check Student Record Exists

Run in Supabase SQL Editor:

```sql
-- Check if your user has a student record
SELECT 
  p.id as profile_id,
  p.email,
  p.role,
  s.id as student_id
FROM profiles p
LEFT JOIN students s ON s.profile_id = p.id
WHERE p.role = 'student'
ORDER BY p.created_at DESC
LIMIT 5;
```

**Expected:** You should see your email with both `profile_id` AND `student_id`.

**If `student_id` is NULL:**
```sql
-- Create student record
INSERT INTO students (profile_id)
SELECT id FROM profiles 
WHERE email = 'your-email@example.com'
AND role = 'student';
```

---

## ✅ Step 6: Manual Test Follow

Try following manually in Supabase:

```sql
-- Get your student ID
SELECT id FROM students 
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'your-email@example.com'
);

-- Get a company ID
SELECT id, name FROM companies LIMIT 1;

-- Now insert a follow (replace IDs):
INSERT INTO company_followers (student_id, company_id)
VALUES (
  'your-student-id-here',
  'company-id-here'
);

-- Check if it worked
SELECT * FROM company_followers;
```

---

## ✅ Step 7: Clear Cache & Restart

Sometimes the browser caches old code:

1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache:**
   - F12 → Network tab → Right-click → Clear cache
3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Step 8: Check UI Rendering

The follow button code is in `/student/browse` page:

### Key code section:
```tsx
{i.company && (
  <div className="flex items-center gap-2">
    <button
      onClick={() => toggleFollowCompany(i.company.id, i.company.is_following)}
      disabled={following === i.company.id}
      className={...}
    >
      {following === i.company.id ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : i.company.is_following ? (
        <>
          <Check className="h-3 w-3" />
          Following
        </>
      ) : (
        <>
          <Bell className="h-3 w-3" />
          Follow
        </>
      )}
    </button>
    <span className="text-xs text-zinc-500 flex items-center gap-1">
      <Users className="h-3 w-3" />
      {i.company.follower_count}
    </span>
  </div>
)}
```

### Debug in browser console:
```javascript
// Check if company data is present
const items = document.querySelectorAll('[data-internship-id]');
console.log('Internship cards found:', items.length);
```

---

## 🐛 Common Issues:

### Issue 1: "Student profile not found"
**Cause:** You don't have a student record  
**Fix:** Run Step 5 to create student record

### Issue 2: Button not visible
**Cause:** Not logged in as student OR UI not rendering  
**Fix:** Check Step 2 and Step 8

### Issue 3: "Already following"
**Cause:** You already followed (that's good!)  
**Fix:** Button should show "Following" ✓

### Issue 4: Database error
**Cause:** Tables not created  
**Fix:** Run Step 1 verification

### Issue 5: Network error
**Cause:** Server not running  
**Fix:** Restart: `npm run dev`

---

## 📊 Quick Health Check

Run all these in Supabase SQL:

```sql
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('company_followers', 'topics', 'topic_followers');
-- Should return 3 rows

-- 2. Check your student status
SELECT p.email, p.role, s.id as student_id
FROM profiles p
LEFT JOIN students s ON s.profile_id = p.id
WHERE p.email = 'YOUR_EMAIL_HERE';
-- Should show your email with student_id

-- 3. Check companies exist
SELECT COUNT(*) as company_count FROM companies;
-- Should be > 0

-- 4. Check if follows work
SELECT COUNT(*) as follow_count FROM company_followers;
-- Can be 0 (no follows yet) or > 0
```

---

## 🚀 After Fixing:

Test the complete flow:

1. Go to `/student/browse`
2. See internships with topics
3. See [Follow] button next to company name
4. Click [Follow]
5. Button changes to [Following] ✓
6. Follower count increases: 👥 1
7. Go to `/student/following` → See company in "Companies" tab
8. Success! 🎉

---

## 📞 Still Not Working?

Share this info:

1. **Browser console errors** (F12 → Console tab)
2. **Network errors** (F12 → Network tab → Filter: "follow")
3. **Your role** (student/company/admin)
4. **SQL query results** from health check above

---

**Most common fix:** Make sure you're logged in as a **student** (not company or admin)!
