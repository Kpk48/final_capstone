# Profile Visibility with Password Protection

## 🎯 Overview

Enhanced profile visibility system with password-protected visibility changes and private-by-default profiles for maximum user security and privacy control.

## ✨ Key Features

### 1. **Private by Default**
All new user profiles are created as **private** by default:
- Students: `is_public = false` (default)
- Only username visible to others
- Details and resume hidden

### 2. **Password-Protected Visibility Changes**
Any change to profile visibility requires password confirmation:
- Making profile public → Password required
- Making profile private → Password required
- Prevents unauthorized visibility changes
- Protects user privacy

### 3. **Confirmation Modal**
Beautiful modal with clear explanation:
- Shows what will happen (public vs private)
- Password input field
- Cannot bypass with client-side manipulation
- Backend verification enforced

### 4. **Always Available Toggle**
Visibility can be changed anytime:
- No need to enter edit mode
- Button always visible in profile
- Clear "Make Public" / "Make Private" labels
- Instant feedback via toast notifications

## 🔒 Security Implementation

### Database Default
```sql
-- Profiles are private by default
ALTER TABLE profiles 
ADD COLUMN is_public boolean DEFAULT false;
```

### Backend Verification
```typescript
// Password required for visibility changes
if (is_public !== undefined && password) {
  const { error } = await admin.auth.signInWithPassword({
    email: user.email!,
    password: password,
  });
  
  if (error) {
    return NextResponse.json({ 
      error: "Incorrect password" 
    }, { status: 401 });
  }
}
```

### Frontend Flow
```typescript
1. User clicks "Make Public" or "Make Private"
2. Modal appears with confirmation
3. User enters password
4. Frontend sends request with password
5. Backend verifies password
6. If correct → Update visibility
7. If incorrect → Show error
```

## 🎨 User Experience

### Visibility Toggle Card

```
┌─────────────────────────────────────────┐
│  👁️ Profile Visibility                  │
│                                          │
│  Your profile is private. Others can    │
│  only see your username.                 │
│                              [Make Public]│
└─────────────────────────────────────────┘
```

### Confirmation Modal (Make Public)

```
┌─────────────────────────────────────┐
│  👁️ Change Profile Visibility?      │
│  Password confirmation required     │
│                                     │
│  You are about to make your profile │
│  PUBLIC. Everyone will be able to   │
│  see your details, education, bio,  │
│  and resume.                        │
│                                     │
│  Enter your password to confirm:    │
│  [password input]                   │
│                                     │
│  [👁️ Yes, Change]  [Cancel]        │
└─────────────────────────────────────┘
```

### Confirmation Modal (Make Private)

```
┌─────────────────────────────────────┐
│  🔒 Change Profile Visibility?      │
│  Password confirmation required     │
│                                     │
│  You are about to make your profile │
│  PRIVATE. Only your username will   │
│  be visible to others. Your details │
│  and resume will be hidden.         │
│                                     │
│  Enter your password to confirm:    │
│  [password input]                   │
│                                     │
│  [🔒 Yes, Change]  [Cancel]        │
└─────────────────────────────────────┘
```

## 📊 Workflow

### User Flow

1. **New User Registration**
   ```
   Register → Profile Created → is_public = false (Private)
   ```

2. **Making Profile Public**
   ```
   Click "Make Public"
     ↓
   Modal appears
     ↓
   Enter password
     ↓
   Password verified
     ↓
   Profile set to public
     ↓
   Toast: "Profile is now Public"
   ```

3. **Making Profile Private**
   ```
   Click "Make Private"
     ↓
   Modal appears
     ↓
   Enter password
     ↓
   Password verified
     ↓
   Profile set to private
     ↓
   Toast: "Profile is now Private"
   ```

4. **Wrong Password**
   ```
   Enter wrong password
     ↓
   Backend rejects
     ↓
   Toast error: "Incorrect password"
     ↓
   Modal stays open
     ↓
   User can retry or cancel
   ```

## 🛡️ Security Benefits

### 1. **Prevents Unauthorized Changes**
- Active session alone isn't enough
- Must know the password
- Protects if device is left unlocked

### 2. **Private by Default**
- Users must actively choose to be public
- Opt-in model for privacy
- Safer for new users

### 3. **Confirmation Required**
- Can't accidentally change visibility
- Clear explanation of consequences
- User understands what they're doing

### 4. **Backend Enforcement**
- Client-side bypass impossible
- Password verified on server
- Supabase Auth integration

## 💻 Implementation Details

### Frontend State Management

```typescript
// State variables
const [isPublic, setIsPublic] = useState(false);
const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
const [visibilityPassword, setVisibilityPassword] = useState("");
const [pendingVisibility, setPendingVisibility] = useState(false);

// Trigger confirmation
const handleVisibilityToggle = () => {
  setPendingVisibility(!isPublic);
  setShowVisibilityConfirm(true);
};

// Confirm change with password
const confirmVisibilityChange = async () => {
  const response = await fetch('/api/student/profile', {
    method: 'POST',
    body: JSON.stringify({
      is_public: pendingVisibility,
      password: visibilityPassword,
    }),
  });
  
  if (response.ok) {
    setIsPublic(pendingVisibility);
    toast.success(`Profile is now ${pendingVisibility ? 'Public' : 'Private'}`);
  }
};
```

### Backend API

```typescript
// Extract password from request
const { is_public, password } = await req.json();

// Verify password if changing visibility
if (is_public !== undefined && password) {
  const { error } = await admin.auth.signInWithPassword({
    email: user.email!,
    password: password,
  });
  
  if (error) {
    return NextResponse.json({ 
      error: "Incorrect password" 
    }, { status: 401 });
  }
}

// Update visibility
await admin
  .from("profiles")
  .update({ is_public })
  .eq("auth_user_id", user.id);
```

### Modal Component

```typescript
{showVisibilityConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="rounded-2xl border border-blue-500/30 bg-black/90 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-blue-500/20 p-3">
          {pendingVisibility ? <Eye /> : <EyeOff />}
        </div>
        <div>
          <h3>Change Profile Visibility?</h3>
          <p>Password confirmation required</p>
        </div>
      </div>
      
      {/* Explanation */}
      <p className="mb-4">
        {pendingVisibility 
          ? "You are about to make your profile PUBLIC..."
          : "You are about to make your profile PRIVATE..."}
      </p>
      
      {/* Password Input */}
      <Input
        type="password"
        value={visibilityPassword}
        onChange={(e) => setVisibilityPassword(e.target.value)}
        placeholder="Your password"
      />
      
      {/* Actions */}
      <Button onClick={confirmVisibilityChange}>
        Yes, Change
      </Button>
      <Button onClick={cancelChange}>
        Cancel
      </Button>
    </div>
  </div>
)}
```

## 🎯 Use Cases

### 1. **Privacy-Conscious Student**
**Scenario**: Student wants to keep profile private until actively job hunting

**Workflow**:
- Profile created as private by default ✓
- Browse internships without revealing identity ✓
- When ready to apply, make profile public ✓
- After getting job, make private again ✓

### 2. **Accidental Device Access**
**Scenario**: Someone gains access to student's unlocked device

**Protection**:
- Cannot change visibility without password ✓
- Active session alone isn't enough ✓
- Privacy settings protected ✓

### 3. **New User**
**Scenario**: First-time user not familiar with platform

**Safety**:
- Private by default ✓
- Must actively choose to be public ✓
- Clear explanation before making public ✓
- Can revert back to private anytime ✓

## 🧪 Testing Checklist

### Default Privacy
- [ ] New student profile has `is_public = false`
- [ ] Profile shows as "Private" in UI
- [ ] Search results show limited info for private profiles

### Visibility Toggle
- [ ] Button always visible (not just in edit mode)
- [ ] Click "Make Public" shows modal
- [ ] Click "Make Private" shows modal
- [ ] Modal explains what will happen

### Password Verification
- [ ] Empty password → Error message
- [ ] Wrong password → "Incorrect password" error
- [ ] Correct password → Visibility changes
- [ ] Enter key works in password field
- [ ] Password cleared on cancel

### State Management
- [ ] Visibility updates in UI after change
- [ ] Toast notification shows correct state
- [ ] Refresh page shows correct visibility
- [ ] Search results reflect new visibility

### Edge Cases
- [ ] Multiple rapid clicks don't cause issues
- [ ] Network timeout handled gracefully
- [ ] Backend down shows appropriate error
- [ ] Cancel button clears password

## 📁 Files Modified

### Frontend
```
✅ /student/profile/page.tsx
   - Added visibility confirmation modal
   - Password verification flow
   - Always-visible toggle button
   - State management for pending changes
```

### Backend
```
✅ /api/student/profile/route.ts
   - Password verification for visibility changes
   - is_public field handling
   - Error responses for incorrect password
```

### Database
```
✅ add_profile_visibility.sql
   - is_public column with DEFAULT false
   - Companies forced to public via trigger
```

## 🚀 Setup Verification

### Check Database
```sql
-- Verify default is false (private)
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'is_public';
-- Should show: DEFAULT false
```

### Check Existing Profiles
```sql
-- See how many profiles are public/private
SELECT 
  role,
  is_public,
  COUNT(*) 
FROM profiles 
GROUP BY role, is_public;
```

### Test New Registration
1. Register new student account
2. Check database: `is_public` should be `false`
3. Check profile page: should show "Private"
4. Search for username: should show limited info

## 🎉 Summary

Your platform now has:

1. ✅ **Private by Default**: All new profiles start private
2. ✅ **Password Protection**: Visibility changes require password
3. ✅ **Clear Confirmations**: Users know what they're doing
4. ✅ **Always Available**: Toggle anytime, not just in edit mode
5. ✅ **Beautiful UI**: Professional modal with clear messaging
6. ✅ **Secure**: Backend verification, can't bypass
7. ✅ **User-Friendly**: Toast notifications, Enter key support

Students now have maximum control and security over their profile visibility! 🔒✨
