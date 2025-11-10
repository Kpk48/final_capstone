# 📬 How to Add Message Button Anywhere

## 🎯 Quick Reference Guide

### **Step 1: Import Component**

```tsx
import { MessageButton } from "@/components/MessageButton";
```

---

### **Step 2: Get Profile ID**

You need the recipient's `profile_id`. Here's how:

#### **If you have student/company data:**

```tsx
// Student data includes profile_id
{student.profile_id}

// Company data includes profile_id  
{company.profile_id}

// Profile data is already the profile_id
{profile.id}
```

#### **Update your API to include profile_id:**

```tsx
// In your API route:
.select("*, student:students(profile_id), company:companies(profile_id)")
```

---

### **Step 3: Add Button**

Choose variant based on context:

#### **Icon (Compact - for cards/lists):**
```tsx
<MessageButton 
  recipientProfileId={user.profile_id}
  recipientName={user.name}
  variant="icon"
/>
```

#### **Outline (Medium - for panels):**
```tsx
<MessageButton 
  recipientProfileId={user.profile_id}
  recipientName={user.name}
  variant="outline"
/>
```

#### **Full (Prominent - for CTAs):**
```tsx
<MessageButton 
  recipientProfileId={user.profile_id}
  recipientName={user.name}
/>
```

---

## 📋 Real Examples

### **Example 1: In Internship Card**

```tsx
// src/app/student/browse/page.tsx

import { MessageButton } from "@/components/MessageButton";

<Card>
  <h3>{internship.title}</h3>
  <p>{internship.company.name}</p>
  
  <div className="flex gap-2">
    {/* Message Icon */}
    <MessageButton
      recipientProfileId={internship.company.profile_id}
      recipientName={internship.company.name}
      variant="icon"
    />
    
    {/* Apply Button */}
    <Button onClick={() => apply(internship.id)}>
      Apply
    </Button>
  </div>
</Card>
```

**Result:** Small message icon appears next to Apply button

---

### **Example 2: In Applicant Detail Modal**

```tsx
// src/app/company/matches/page.tsx

import { MessageButton } from "@/components/MessageButton";

<Modal>
  <h2>{applicant.name}</h2>
  <p>Match Score: {applicant.score}</p>
  
  {/* Message Button */}
  <MessageButton
    recipientProfileId={applicant.profile_id}
    recipientName={applicant.name}
    applicationId={application.id}  // Links to application
    variant="outline"
  />
  
  {/* Action Buttons */}
  <Button onClick={() => accept(application.id)}>Accept</Button>
  <Button onClick={() => reject(application.id)}>Reject</Button>
</Modal>
```

**Result:** Outlined message button with application context

---

### **Example 3: In User Profile**

```tsx
// src/app/profiles/[id]/page.tsx

import { MessageButton } from "@/components/MessageButton";

<div className="profile-header">
  <Avatar src={user.avatar_url} />
  <h1>{user.display_name}</h1>
  <p>{user.role}</p>
  
  {/* Message Button */}
  <MessageButton
    recipientProfileId={user.profile_id}
    recipientName={user.display_name}
  />
</div>
```

**Result:** Full gradient message button as main CTA

---

### **Example 4: In Admin Panel**

```tsx
// src/app/admin/data/page.tsx

import { MessageButton } from "@/components/MessageButton";

<Table>
  <TableRow>
    <TableCell>{application.student_name}</TableCell>
    <TableCell>{application.company_name}</TableCell>
    <TableCell>
      {/* Message Student */}
      <MessageButton
        recipientProfileId={application.student_profile_id}
        recipientName={application.student_name}
        applicationId={application.id}
        variant="icon"
      />
      
      {/* Message Company */}
      <MessageButton
        recipientProfileId={application.company_profile_id}
        recipientName={application.company_name}
        applicationId={application.id}
        variant="icon"
      />
    </TableCell>
  </TableRow>
</Table>
```

**Result:** Icon buttons to message both student and company

---

## 🔧 Updating APIs to Include profile_id

### **Students API:**

```tsx
// Before
.select("id, university, degree")

// After  
.select("id, university, degree, profile_id")
```

### **Companies API:**

```tsx
// Before
.select("id, name, website")

// After
.select("id, name, website, profile_id")
```

### **Internships API (with company):**

```tsx
// Before
.select("*, company:companies(name)")

// After
.select("*, company:companies(name, profile_id)")
```

### **Applications API (with student and company):**

```tsx
.select(`
  *,
  student:students(
    id,
    profile_id,
    profile:profiles(display_name)
  ),
  internship:internships(
    title,
    company:companies(name, profile_id)
  )
`)
```

---

## ⚠️ Common Issues

### **Issue 1: profile_id is undefined**

**Cause:** API doesn't return profile_id

**Fix:** Update your API select to include `profile_id`:
```tsx
.select("*, profile_id")
```

---

### **Issue 2: Button doesn't appear**

**Cause:** Conditional rendering hiding button

**Fix:** Check your condition:
```tsx
// Wrong
{company && <MessageButton ... />}

// Right
{company?.profile_id && <MessageButton recipientProfileId={company.profile_id} ... />}
```

---

### **Issue 3: Can't message yourself**

**Expected behavior** - Users shouldn't message themselves

**Fix:** Add condition:
```tsx
{user.profile_id !== currentUser.profile_id && (
  <MessageButton recipientProfileId={user.profile_id} ... />
)}
```

---

## 🎨 Styling Tips

### **Icon Button Positioning:**

```tsx
// Next to other actions
<div className="flex gap-2 items-center">
  <MessageButton variant="icon" ... />
  <EditButton />
  <DeleteButton />
</div>
```

### **Outline Button in Cards:**

```tsx
// Bottom of card
<Card>
  {/* Content */}
  
  <div className="mt-4 flex justify-end">
    <MessageButton variant="outline" ... />
  </div>
</Card>
```

### **Full Button as CTA:**

```tsx
// Hero section
<div className="text-center">
  <h1>Connect with {user.name}</h1>
  <MessageButton 
    recipientProfileId={user.profile_id}
    recipientName={user.name}
    className="mt-4"
  />
</div>
```

---

## 📦 Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `recipientProfileId` | string | ✅ Yes | Profile ID of recipient |
| `recipientName` | string | ❌ No | Name to display in button |
| `applicationId` | string | ❌ No | Link to application |
| `variant` | "default" \| "icon" \| "outline" | ❌ No | Button style |
| `size` | "sm" \| "md" \| "lg" | ❌ No | Button size |
| `className` | string | ❌ No | Additional CSS classes |

---

## ✅ Checklist

Before adding message button:

- [ ] Import `MessageButton` component
- [ ] Have `profile_id` of recipient
- [ ] Choose appropriate variant
- [ ] Add to UI in logical position
- [ ] Test button click
- [ ] Verify conversation created
- [ ] Check redirect to /messages

---

## 🎯 Best Practices

1. **Use icon variant** in lists/cards (compact)
2. **Use outline variant** in modals/panels (balanced)
3. **Use full variant** for primary CTAs (prominent)
4. **Include recipientName** for better UX
5. **Link applicationId** when messaging about applications
6. **Don't show** for current user (can't message yourself)
7. **Add loading states** are automatic
8. **Test on mobile** - icon variant works best

---

## 🚀 Quick Start Template

Copy-paste this template:

```tsx
import { MessageButton } from "@/components/MessageButton";

// In your component:
<MessageButton
  recipientProfileId={PROFILE_ID_HERE}
  recipientName={NAME_HERE}
  variant="icon"  // or "outline" or leave empty for default
  applicationId={APP_ID_HERE}  // optional
/>
```

Replace:
- `PROFILE_ID_HERE` with actual profile ID
- `NAME_HERE` with user's name
- `APP_ID_HERE` with application ID (if applicable)

**Done!** 🎉

---

## 💡 Pro Tips

- **Variant selection:** Cards = icon, Modals = outline, Hero = default
- **Application linking:** Always link when messaging about specific application
- **User search:** For "New Chat" functionality, use `/messages` page
- **Tooltips:** Icon variant shows tooltip on hover
- **Accessibility:** All variants have proper ARIA labels

**Now go add messaging everywhere!** 💬✨
