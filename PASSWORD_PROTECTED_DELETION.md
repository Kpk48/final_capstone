# Password-Protected Profile Deletion

## 🔒 Security Enhancement

Profile deletion now requires password verification to prevent accidental or unauthorized deletions.

## ✨ Implementation Details

### Frontend Changes

#### 1. **Delete Confirmation Modal**
Added password input field to the deletion modal:

```typescript
// State management
const [deletePassword, setDeletePassword] = useState("");

// Password input in modal
<Input
  type="password"
  value={deletePassword}
  onChange={(e) => setDeletePassword(e.target.value)}
  placeholder="Your password"
  className="bg-white/10 border-red-500/30 text-white"
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !loading) {
      deleteProfile();
    }
  }}
/>
```

#### 2. **Validation**
- Checks if password is entered before making API call
- Shows error toast if password field is empty
- Supports Enter key to submit

#### 3. **Password Clearing**
- Password is cleared when modal is canceled
- Prevents password from persisting in state

### Backend Changes

#### Updated DELETE Endpoint
**File**: `/api/student/profile/route.ts`

**Password Verification Process**:
```typescript
1. Extract password from request body
2. Get current authenticated user
3. Verify password using Supabase signInWithPassword
4. If password incorrect → Return 401 error
5. If password correct → Proceed with deletion
```

**Security Flow**:
```
User clicks Delete 
  ↓
Enters password in modal
  ↓
Frontend sends DELETE with password
  ↓
Backend verifies password with Supabase Auth
  ↓
If correct: Delete profile + auth user
  ↓
If incorrect: Return error message
```

## 🎯 User Experience

### Deletion Flow

1. **Click Delete Button**
   - User clicks "Delete Profile" button in view mode
   - Modal appears with warning message

2. **Enter Password**
   - Password input field is prominently displayed
   - Label: "Enter your password to confirm"
   - Red-themed to indicate danger
   - Placeholder: "Your password"

3. **Submit**
   - Click "Yes, Delete" button OR press Enter
   - Loading state shows "Deleting..."
   - Password is verified on backend

4. **Success**
   - Toast: "Profile deleted successfully"
   - Redirects to homepage
   - User is logged out

5. **Error Cases**
   - Empty password: "Please enter your password"
   - Wrong password: "Incorrect password"
   - Network error: "Failed to delete profile"

## 🛡️ Security Features

### Protection Against

1. **Accidental Deletion**
   - Requires explicit password entry
   - Can't accidentally click through

2. **Unauthorized Deletion**
   - Password verification prevents others from deleting
   - Even if session is active on shared device

3. **Session Hijacking**
   - Active session alone isn't enough
   - Must know the password

### Password Security

- **Type**: `type="password"` hides characters
- **Transmission**: Sent via HTTPS in request body
- **Verification**: Uses Supabase Auth (secure password hashing)
- **Cleared**: Password state cleared on cancel
- **No Storage**: Password never stored or logged

## 📱 UI/UX Details

### Modal Layout

```
┌─────────────────────────────────────┐
│  🗑️ Delete Profile?                 │
│  This action cannot be undone       │
│                                      │
│  Are you sure you want to delete... │
│                                      │
│  Enter your password to confirm     │
│  [password input field]             │
│                                      │
│  [Yes, Delete]  [Cancel]            │
└─────────────────────────────────────┘
```

### Visual Styling

- **Border**: Red border (`border-red-500/30`)
- **Input**: Red-themed border on focus
- **Button**: Red background for delete action
- **Icon**: Trash icon in red circle
- **Loading**: Spinner with "Deleting..." text

## 🔑 Key Features

### 1. **Required Field**
```typescript
if (!deletePassword.trim()) {
  toast.error('Please enter your password');
  return;
}
```

### 2. **Keyboard Support**
```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter' && !loading) {
    deleteProfile();
  }
}}
```

### 3. **Clear on Cancel**
```typescript
onClick={() => {
  setShowDeleteConfirm(false);
  setDeletePassword("");
}}
```

### 4. **Disabled During Loading**
```typescript
disabled={loading}
```

## 🔐 Backend Verification

### Supabase Auth Integration

```typescript
// Verify password
const { error: signInError } = await admin.auth.signInWithPassword({
  email: user.email!,
  password: password,
});

if (signInError) {
  return NextResponse.json({ 
    error: "Incorrect password" 
  }, { status: 401 });
}
```

### Error Handling

**400 Bad Request**: Missing password
```json
{ "error": "Password is required" }
```

**401 Unauthorized**: Wrong password
```json
{ "error": "Incorrect password" }
```

**401 Unauthorized**: Not logged in
```json
{ "error": "Unauthorized" }
```

**500 Server Error**: Database/auth issues
```json
{ "error": "Failed to delete profile" }
```

## 🎨 Implementation Code

### Frontend (page.tsx)

```typescript
const [deletePassword, setDeletePassword] = useState("");

const deleteProfile = async () => {
  if (!deletePassword.trim()) {
    toast.error('Please enter your password');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/student/profile', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: deletePassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete profile');
    }
    
    toast.success('Profile deleted successfully');
    window.location.href = '/';
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete profile');
    setLoading(false);
  }
};
```

### Backend (route.ts)

```typescript
export async function DELETE(req: NextRequest) {
  const { password } = await req.json();
  
  if (!password) {
    return NextResponse.json({ 
      error: "Password is required" 
    }, { status: 400 });
  }

  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  
  const { data: { user } } = await server.auth.getUser();
  
  // Verify password
  const { error: signInError } = await admin.auth.signInWithPassword({
    email: user.email!,
    password: password,
  });

  if (signInError) {
    return NextResponse.json({ 
      error: "Incorrect password" 
    }, { status: 401 });
  }

  // Delete profile and auth user
  await admin.from("profiles").delete().eq("auth_user_id", user.id);
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ success: true });
}
```

## ✅ Testing Checklist

### Manual Testing

- [ ] Click "Delete Profile" button
- [ ] Verify modal appears with password field
- [ ] Try submitting with empty password → Error toast
- [ ] Try submitting with wrong password → "Incorrect password"
- [ ] Try submitting with correct password → Success
- [ ] Verify redirect to homepage
- [ ] Try logging in with deleted account → Should fail
- [ ] Test keyboard support (Enter key)
- [ ] Test cancel button clears password
- [ ] Test loading states and disabled fields

### Edge Cases

- [ ] Very long password
- [ ] Special characters in password
- [ ] Copy-paste password
- [ ] Network timeout during deletion
- [ ] Multiple rapid clicks
- [ ] Modal close during loading

## 🚀 Benefits

### User Benefits
- ✅ Protection from accidental deletion
- ✅ Peace of mind with verification step
- ✅ Clear feedback on errors
- ✅ Can cancel safely

### Platform Benefits
- ✅ Reduced support requests for accidental deletions
- ✅ Better security compliance
- ✅ Audit trail (password verification)
- ✅ User trust and confidence

## 📊 Comparison

### Before
```
Click Delete → Confirm → Profile Deleted
```
**Risk**: Accidental clicks, unauthorized access

### After
```
Click Delete → Enter Password → Verify → Profile Deleted
```
**Security**: Password required, prevents accidents

## 🎉 Summary

Profile deletion is now secure and requires password verification:

1. **User-Friendly**: Clear modal with password input
2. **Secure**: Backend password verification via Supabase Auth
3. **Safe**: Prevents accidental and unauthorized deletions
4. **Feedback**: Toast notifications for all states
5. **Keyboard**: Enter key support
6. **Clean**: Password cleared on cancel

This adds an essential security layer while maintaining good UX! 🔒✨
