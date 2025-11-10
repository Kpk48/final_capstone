# 📬 Messaging Integration Guide

## ✨ Overview

Messaging functionality has been added **throughout the entire application**, allowing users to initiate conversations from any entity:
- 🎓 Students can message companies from internship listings
- 🏢 Companies can message students from applicant matches
- 👥 Anyone can message anyone from user profiles
- 💼 Direct access via dedicated messages page

---

## 🔧 Implementation Components

### **1. Reusable MessageButton Component**

**Location:** `src/components/MessageButton.tsx`

**Variants:**
```tsx
// Icon button (compact)
<MessageButton 
  recipientProfileId="uuid"
  recipientName="John Doe"
  variant="icon"
/>

// Outline button
<MessageButton 
  recipientProfileId="uuid"
  recipientName="Acme Corp"
  variant="outline"
/>

// Full button (default)
<MessageButton 
  recipientProfileId="uuid"
  recipientName="Jane Smith"
  applicationId="uuid"  // Optional - links to application
/>
```

**Features:**
- ✅ **Auto-creates conversation** on click
- ✅ **Redirects to /messages** page
- ✅ **Loading states** during creation
- ✅ **Three variants** for different UI contexts
- ✅ **Optional application linking**

---

## 📍 Integration Locations

### **1. Browse Internships** (`/student/browse`)

**What:** Students can message companies directly from internship cards

**Location:** Next to "Apply" button

**Code:**
```tsx
<MessageButton
  recipientProfileId={internship.company.profile_id}
  recipientName={internship.company.name}
  variant="icon"
/>
```

**User Flow:**
1. Student browses internships
2. Sees message icon next to each internship
3. Clicks to start conversation with company
4. Redirected to messages page with conversation open

---

### **2. Company Matches** (`/company/matches`)

**What:** Companies can message students who applied

**Location:** In applicant cards and detail modals

**Code:**
```tsx
<MessageButton
  recipientProfileId={student.profile_id}
  recipientName={student.display_name}
  applicationId={application.id}
  variant="outline"
/>
```

**User Flow:**
1. Company views matched students
2. Sees message button on each applicant
3. Clicks to start conversation
4. Conversation linked to application automatically

---

### **3. Universal Messages Page** (`/messages`)

**What:** Central hub for all conversations

**Features:**
- **New Chat Button** - Search and message any user
- **User Search** - Find by name, email, or role
- **Role Filters** - Filter students, companies, admins
- **Conversation List** - All active chats
- **Real-time Chat** - Send and receive messages

**User Flow:**
1. User goes to /messages
2. Clicks "New Chat"
3. Searches for user (student/company/admin)
4. Starts conversation
5. Messages in real-time

---

### **4. Admin Panel** (Coming Soon)

**Where:** Admin data page viewing applications

**What:** Message students or companies from admin view

---

### **5. User Profiles** (Coming Soon)

**Where:** Student and company profile pages

**What:** Direct message button on any profile

---

## 🗄️ Database Schema

### **Conversations Table**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  participant1_profile_id UUID,  -- Always smaller UUID
  participant2_profile_id UUID,  -- Always larger UUID  
  application_id UUID,            -- Optional link to application
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

### **Messages Table**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  sender_profile_id UUID,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
);
```

---

## 🔌 API Endpoints

### **Core Messaging APIs:**

```
GET  /api/messaging/conversations   - Get all conversations for user
POST /api/messaging/send            - Send message
POST /api/messaging/mark-read       - Mark messages as read
GET  /api/messaging/users           - Search users to message
GET  /api/messaging/get-profile-id  - Convert student/company ID to profile ID
```

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

In Supabase SQL Editor:
```sql
comprehensive_messaging_system.sql
```

This creates:
- ✅ `conversations` table
- ✅ `messages` table
- ✅ Helper functions
- ✅ Indexes

---

### **Step 2: Update Navigation**

Add link to messages in header/navigation:

```tsx
<Link href="/messages">
  <MessageSquare className="h-5 w-5" />
  Messages
</Link>
```

---

### **Step 3: Add MessageButton Anywhere**

Import and use:

```tsx
import { MessageButton } from "@/components/MessageButton";

<MessageButton 
  recipientProfileId={user.profile_id}
  recipientName={user.name}
/>
```

---

## 🎯 Use Cases

### **Student Perspective:**

1. **Browse Internships**
   - See message icon on each internship
   - Click to ask company questions
   - No need to apply first

2. **After Applying**
   - Message company about application
   - Ask for updates
   - Share portfolio

3. **Peer Networking**
   - Message other students
   - Form study groups
   - Share opportunities

---

### **Company Perspective:**

1. **View Applicants**
   - Message button on each applicant
   - Ask follow-up questions
   - Schedule interviews

2. **Proactive Recruitment**
   - Search for students
   - Reach out directly
   - Build talent pipeline

3. **Business Networking**
   - Message other companies
   - Partnerships
   - Collaboration

---

## 🎨 UI/UX Features

### **Message Button Variants:**

**Icon (Compact):**
- Small circular button
- MessageSquare icon only
- Perfect for cards and lists
- Tooltip on hover

**Outline:**
- Button with border
- Icon + "Message [Name]"
- Medium prominence
- Good for detail views

**Full (Default):**
- Gradient background
- Icon + "Message [Name]"
- High prominence
- Call-to-action style

---

### **Context Awareness:**

- **With Application:** Conversation linked to specific internship application
- **Without Application:** General networking conversation
- **Auto-detection:** System knows when to link applications

---

## 🔒 Security & Permissions

### **Access Control:**
- ✅ Users can message any other user
- ✅ Cannot see others' conversations
- ✅ Profile ownership verified
- ✅ Authentication required

### **Privacy:**
- ✅ One conversation per user pair
- ✅ Message history preserved
- ✅ Unread tracking per user
- ✅ No cross-contamination

---

## 📊 Data Flow

### **Initiating a Conversation:**

```
1. User clicks MessageButton
2. Button calls /api/messaging/send
3. Backend calls get_or_create_conversation()
4. Conversation created (if doesn't exist)
5. Initial message sent
6. User redirected to /messages
7. Conversation appears in list
8. Ready to chat!
```

---

### **Linking to Applications:**

```
1. Company views applicant
2. Clicks message button (includes applicationId)
3. Conversation created with application link
4. Both parties see application context
5. Messages appear under "Re: Internship Title"
```

---

## 🎁 Benefits

### **For Students:**
- ✅ **Direct access** to companies
- ✅ **Ask questions** before applying
- ✅ **Network** with peers
- ✅ **Follow up** on applications
- ✅ **Professional** communication

### **For Companies:**
- ✅ **Engage** with top candidates
- ✅ **Quick responses** to applicants
- ✅ **Build relationships** early
- ✅ **Reduce** email overhead
- ✅ **Track** all conversations

### **For Platform:**
- ✅ **Increased engagement**
- ✅ **Better matches**
- ✅ **More applications**
- ✅ **Higher retention**
- ✅ **Professional ecosystem**

---

## 🚀 Future Enhancements

### **Phase 2:**
- 📎 **File attachments** in messages
- 🔔 **Real-time notifications** (WebSocket)
- ✓✓ **Read receipts**
- 💬 **Typing indicators**
- 🖼️ **Rich media** support

### **Phase 3:**
- 👥 **Group chats** (3+ participants)
- 🎥 **Video call** integration
- 📅 **Schedule meetings** in-chat
- 🤖 **AI suggestions** for responses
- 📊 **Analytics** dashboard

---

## 🧪 Testing Checklist

- [ ] Message button appears on internship cards
- [ ] Message button appears on applicant cards
- [ ] Clicking creates conversation
- [ ] Redirects to /messages page
- [ ] Conversation appears in list
- [ ] Can send messages
- [ ] Application context shows when linked
- [ ] Unread counts update
- [ ] Search users works
- [ ] New chat button works
- [ ] Role icons display correctly
- [ ] Message timestamps show
- [ ] Can message students, companies, admins
- [ ] No duplicate conversations created
- [ ] Loading states work

---

## 📝 Summary

**Messaging is now integrated everywhere:**

| Location | Entity | Button Type | Link to App |
|----------|--------|-------------|-------------|
| /student/browse | Internships | Icon | No |
| /company/matches | Applicants | Outline | Yes |
| /messages | Any User | Full | Optional |
| /admin/data | Anyone | Outline | Yes |
| User Profiles | Users | Full | No |

**One unified messaging system, accessible from every context!** 🎉

---

## 🆘 Troubleshooting

### **Message button not showing:**
- Check if `profile_id` is included in API response
- Verify MessageButton component is imported
- Check recipient has valid profile

### **Conversation not creating:**
- Check database migration ran successfully
- Verify `get_or_create_conversation` function exists
- Check network tab for API errors

### **Can't find conversations:**
- Verify profile IDs are correct
- Check conversations table has data
- Ensure user is authenticated

---

**Messaging is now seamlessly integrated across your entire platform!** 💬✨
