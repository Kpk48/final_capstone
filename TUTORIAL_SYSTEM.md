# Interactive Tutorial System

## 🎯 Overview

A dynamic, step-by-step guided tour for first-time users that highlights important features and teaches them how to use the platform based on their role (Student, Company, or Admin).

---

## ✨ Features

### **Role-Based Tours**
Different tutorials for each user type:
- **Students**: 9 steps covering Profile, Browse, AI Recommendations, Applications, Search, Notifications, Carlos
- **Companies**: 9 steps covering Company Profile, Post Internships, Matches, Search, Notifications, Messages, Carlos
- **Admins**: 9 steps covering Analytics, User Management, Data Management, Tools, Dashboard, Notifications, Carlos

### **Auto-Detection**
- Checks if tutorial is completed via API
- Shows automatically on first login
- Never shows again after completion

### **Interactive Highlighting**
- Highlights target elements with spotlight effect
- Dark overlay for focus
- Smooth animations
- Tooltips with arrows pointing to features

### **User Control**
- "Next" button to proceed
- "Back" button to review
- "Skip Tour" to exit anytime
- Progress indicator (e.g., 3/9)

### **Persistent State**
- Tutorial completion saved in `user_preferences.tutorial_completed`
- Survives page refresh and logout/login
- Per-user tracking

---

## 🗂️ Files Created

### 1. **API Endpoint** (`/api/tutorial/route.ts`)
```typescript
GET  /api/tutorial  - Check if tutorial completed
POST /api/tutorial  - Mark tutorial as completed
```

### 2. **Tutorial Configuration** (`/config/tutorialSteps.ts`)
- `studentTutorialSteps`: 9 steps for students
- `companyTutorialSteps`: 9 steps for companies
- `adminTutorialSteps`: 9 steps for admins
- Each step has: target, content, title, placement

### 3. **Tutorial Component** (`/components/Tutorial.tsx`)
- Uses React Joyride library
- Fetches completion status
- Runs tour automatically if not completed
- Marks as completed when finished/skipped

### 4. **Tutorial Provider** (`/components/TutorialProvider.tsx`)
- Client component wrapper
- Fetches user role
- Renders appropriate Tutorial component

### 5. **Updated Files**
- `layout.tsx`: Added TutorialProvider
- `Header.tsx`: Added `data-tour` attributes to navigation links
- `Carlos.tsx`: Added `data-tour="carlos"` attribute
- `package.json`: Added `react-joyride` dependency

---

## 📦 Installation

### Install Dependencies
```bash
npm install react-joyride
# or
npm install
```

This will install the React Joyride library for creating the guided tour.

---

## 🎨 Tutorial Steps

### **Student Tour** (9 Steps)

1. **Welcome** (center)
   - "Welcome to SkillSync! Let me show you around..."

2. **Profile** (bottom)
   - Target: `[data-tour="student-profile"]`
   - Explains: Resume upload, education, visibility control

3. **Browse Internships** (bottom)
   - Target: `[data-tour="student-browse"]`
   - Explains: Filter, stipend display

4. **AI Recommendations** (bottom)
   - Target: `[data-tour="student-recommendations"]`
   - Explains: AI matching, profile tips

5. **Applications** (bottom)
   - Target: `[data-tour="student-applications"]`
   - Explains: Track status, message companies

6. **Search** (bottom)
   - Target: `[data-tour="search"]`
   - Explains: Find students and companies

7. **Notifications** (left)
   - Target: `[data-tour="notifications"]`
   - Explains: Status updates, preferences

8. **Carlos AI Assistant** (left)
   - Target: `[data-tour="carlos"]`
   - Explains: Ask questions, navigate

9. **Ready to Go** (center)
   - Final encouragement message

### **Company Tour** (9 Steps)

1. **Welcome** (center)
2. **Company Profile** (`company-profile`)
3. **Post Internships** (`company-post`)
4. **Matched Candidates** (`company-matches`)
5. **Search Talent** (`search`)
6. **Notifications** (`notifications`)
7. **Messages** (`messages`)
8. **Carlos AI Assistant** (`carlos`)
9. **Ready to Hire** (center)

### **Admin Tour** (9 Steps)

1. **Welcome** (center)
2. **Analytics Dashboard** (`admin-analytics`)
3. **User Management** (`admin-users`)
4. **Data Management** (`admin-data`)
5. **Search Tools** (`admin-tools`)
6. **Dashboard** (`dashboard`)
7. **Notifications** (`notifications`)
8. **Carlos AI Assistant** (`carlos`)
9. **Admin Access Granted** (center)

---

## 🔧 How It Works

### Flow Diagram
```
User logs in for first time
  ↓
TutorialProvider fetches user role
  ↓
Tutorial component checks completion status (GET /api/tutorial)
  ↓
If tutorial_completed = false:
  ↓
  Load role-specific steps
  ↓
  Show guided tour with React Joyride
  ↓
  User completes or skips
  ↓
  Mark as completed (POST /api/tutorial)
  ↓
  Update user_preferences.tutorial_completed = true
  ↓
  Tour never shows again
```

### Database
```sql
user_preferences
├── user_id (UUID) - references profiles(id)
├── tutorial_completed (boolean) - DEFAULT false
├── email_notifications (boolean)
├── browser_notifications (boolean)
└── ...
```

---

## 🎯 Adding Tour Targets

### To add a new step to any tour:

**1. Add data-tour attribute to the element**
```tsx
<button data-tour="my-feature">My Feature</button>
```

**2. Add step to tutorialSteps.ts**
```typescript
{
  target: '[data-tour="my-feature"]',
  content: 'This is my new feature! It does X, Y, and Z.',
  title: '🎉 New Feature',
  placement: 'bottom',
}
```

**3. Update step count**
The tutorial automatically shows progress (e.g., "4/10 steps")

---

## 🎨 Customization

### Colors & Styling
Edit in `Tutorial.tsx`:
```typescript
styles: {
  options: {
    primaryColor: '#8b5cf6',  // Purple
    backgroundColor: '#1a1a2e', // Dark
    textColor: '#ffffff',     // White
  }
}
```

### Step Placement
Options: `'top' | 'bottom' | 'left' | 'right' | 'center'`

### Disable Beacon
```typescript
{
  target: 'body',
  disableBeacon: true,  // No pulsing beacon, show immediately
}
```

---

## 🧪 Testing

### Test Tutorial for Each Role

**1. Clear tutorial completion**
```sql
-- In Supabase SQL Editor
UPDATE user_preferences 
SET tutorial_completed = false 
WHERE user_id = 'YOUR_USER_ID';
```

**2. Logout and login again**

**3. Tutorial should appear automatically**

**4. Test actions:**
- Click "Next" through all steps
- Click "Back" to previous step
- Click "Skip Tour"
- Complete the tour

**5. Verify completion:**
```sql
SELECT tutorial_completed 
FROM user_preferences 
WHERE user_id = 'YOUR_USER_ID';
-- Should be true
```

### Test Different Roles

**Student**: Should see 9 student-specific steps
**Company**: Should see 9 company-specific steps
**Admin**: Should see 9 admin-specific steps

---

## 📱 Responsive Behavior

- **Desktop**: Full tooltips with 380px width
- **Mobile**: Automatically adjusts placement
- **Touch**: Works with touch events
- **Overlay**: Prevents interaction with other elements during tour

---

## 🔄 Reset Tutorial

### For Testing or User Request

**Option 1: Via Database**
```sql
UPDATE user_preferences 
SET tutorial_completed = false 
WHERE user_id = (
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
);
```

**Option 2: Add Reset Button (Optional)**
In settings/profile page:
```tsx
<Button onClick={resetTutorial}>
  Restart Tutorial
</Button>

const resetTutorial = async () => {
  await fetch('/api/tutorial/reset', { method: 'POST' });
  window.location.reload();
};
```

Then create `/api/tutorial/reset/route.ts`:
```typescript
export async function POST() {
  // Set tutorial_completed = false
  // Return success
}
```

---

## 🎭 Tour Behavior

### Auto-Start Conditions
✅ User logged in
✅ Has valid role (student/company/admin)
✅ tutorial_completed = false
✅ DOM is ready (1 second delay)

### Won't Show If:
❌ User not logged in
❌ Invalid role or no profile
❌ tutorial_completed = true
❌ API error

### Completion Triggers
- User clicks "Finish" on last step
- User clicks "Skip Tour" anytime
- Both mark tutorial as completed

---

## 🚀 Best Practices

### 1. **Keep Steps Concise**
- Title: 3-5 words
- Content: 1-2 sentences
- Use emojis for visual appeal

### 2. **Logical Order**
Follow typical user journey:
1. Profile setup
2. Main features
3. Advanced features
4. Help/support

### 3. **Highlight Key Features**
Focus on what users NEED to know, not everything

### 4. **Test with Real Users**
Get feedback on:
- Is it too long?
- Are explanations clear?
- Any confusing steps?

### 5. **Update as Features Change**
When you add/remove features, update tour steps

---

## 📊 Analytics (Future Enhancement)

Track tutorial engagement:
```typescript
// How many users complete the tour?
// Which steps do users skip?
// Average completion time?
```

Add to database:
```sql
ALTER TABLE user_preferences
ADD COLUMN tutorial_started_at TIMESTAMPTZ,
ADD COLUMN tutorial_completed_at TIMESTAMPTZ,
ADD COLUMN tutorial_skipped BOOLEAN DEFAULT false;
```

---

## 🎓 Example Usage

### Manual Trigger
If you want to allow users to restart the tour:

```tsx
"use client";
import { useState } from "react";
import Tutorial from "@/components/Tutorial";

export default function SettingsPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowTutorial(true)}>
        Watch Tutorial Again
      </Button>
      
      {showTutorial && <Tutorial role="student" />}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Tutorial not showing?

**Check:**
1. Is `react-joyride` installed? Run `npm install`
2. Is user logged in? Check `/api/me`
3. Is tutorial completed? Check database
4. Are `data-tour` attributes present? Inspect DOM
5. Console errors? Check browser console

### Elements not highlighting?

**Fix:**
1. Ensure `data-tour` attribute matches step target
2. Check element exists in DOM (not hidden)
3. Wait for DOM to load (1 second delay already added)
4. Check CSS selector syntax

### Tutorial appearing every time?

**Fix:**
1. Check API is marking as completed
2. Verify database update
3. Check for API errors in console

---

## 📝 Summary

Your tutorial system is now complete with:

✅ **3 role-based tours** (Student, Company, Admin)
✅ **9 steps each** with clear explanations
✅ **Auto-detection** for first-time users
✅ **Persistent state** saved in database
✅ **Beautiful UI** with purple theme
✅ **User control** (Next, Back, Skip)
✅ **Responsive** and accessible

### Next Steps:

1. **Install dependency**: `npm install react-joyride`
2. **Test each role**: Clear completion flag and login
3. **Customize**: Adjust colors, text, or steps as needed
4. **Deploy**: Tutorial will auto-show for all new users!

Enjoy your interactive onboarding experience! 🎉
