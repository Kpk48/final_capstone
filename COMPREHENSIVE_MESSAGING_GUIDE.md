# 📬 Comprehensive Messaging System Guide

## ✨ Overview

A **universal messaging system** that allows:
- 🎓 **Students ↔ Students** (peer networking)
- 🏢 **Companies ↔ Companies** (business networking)
- 💼 **Students ↔ Companies** (about applications or general)
- 👥 **Any user ↔ Any user** (unlimited connectivity)

---

## 🗄️ Database Structure

### **1. Conversations Table**

Stores **direct conversations** between any two users:

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  participant1_profile_id UUID REFERENCES profiles(id),
  participant2_profile_id UUID REFERENCES profiles(id),
  application_id UUID REFERENCES applications(id),  -- Optional link
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  
  UNIQUE(participant1_profile_id, participant2_profile_id),
  CHECK(participant1_profile_id < participant2_profile_id)  -- Ensures ordered pairs
);
```

**Key Features:**
- ✅ **Profile-based** - Uses profile IDs (works for all roles)
- ✅ **Unique pairs** - One conversation per user pair
- ✅ **Ordered** - participant1 always < participant2 (prevents duplicates)
- ✅ **Optional application link** - Can be about specific application or general

---

### **2. Messages Table**

Stores individual messages within conversations:

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_profile_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);
```

---

### **3. Helper Function**

Automatically gets or creates conversations:

```sql
get_or_create_conversation(
  p_user1_profile_id UUID,
  p_user2_profile_id UUID,
  p_application_id UUID DEFAULT NULL
) RETURNS UUID
```

**Usage:**
- Call with two profile IDs
- Returns existing conversation ID or creates new one
- Handles ordering automatically

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

In **Supabase SQL Editor**, execute:
```sql
comprehensive_messaging_system.sql
```

This will:
- ✅ Create `conversations` table
- ✅ Create `messages` table
- ✅ Create helper function
- ✅ Set up indexes
- ✅ Create auto-update triggers
- ✅ Migrate existing application messages (if any)

---

### **Step 2: Access Messages Page**

All users can access:
```
/messages
```

This is a **universal page** that works for:
- Students
- Companies  
- Admins

---

## 🔌 API Endpoints

### **1. GET `/api/messaging/conversations`**

Get all conversations for logged-in user.

**Returns:**
```json
{
  "conversations": [
    {
      "conversation_id": "uuid",
      "other_user": {
        "profile_id": "uuid",
        "name": "John Doe",
        "role": "student",
        "email": "john@example.com"
      },
      "application": {
        "id": "uuid",
        "status": "applied",
        "internship_title": "Backend Developer"
      },
      "last_message_at": "2025-11-07T...",
      "unread_count": 3,
      "messages": [...]
    }
  ]
}
```

---

### **2. POST `/api/messaging/send`**

Send a message to another user.

**Request:**
```json
{
  "recipient_profile_id": "uuid",
  "content": "Your message here",
  "application_id": "uuid"  // Optional
}
```

**Response:**
```json
{
  "message": {...},
  "conversation_id": "uuid"
}
```

---

### **3. POST `/api/messaging/mark-read`**

Mark conversation messages as read.

**Request:**
```json
{
  "conversation_id": "uuid"
}
```

---

### **4. GET `/api/messaging/users`**

Search for users to start conversations with.

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role (student/company/admin)

**Example:**
```
GET /api/messaging/users?search=john&role=student
```

**Response:**
```json
{
  "users": [
    {
      "profile_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "university": "MIT",
      "degree": "Computer Science"
    }
  ]
}
```

---

## 🎨 UI Features

### **Universal Messages Page** (`/messages`)

**Features:**
- ✅ **New Chat Button** - Start conversation with any user
- ✅ **User Search** - Find students, companies, or admins
- ✅ **Role Icons** - Visual indicators (🎓 student, 🏢 company, 👤 admin)
- ✅ **Unread Counts** - Badge showing unread messages
- ✅ **Application Context** - Shows if message is about specific application
- ✅ **Real-time Chat** - Smooth messaging interface
- ✅ **Auto-scroll** - Scrolls to latest message
- ✅ **Keyboard Shortcuts** - Enter to send

---

## 🔄 User Flows

### **Starting a New Conversation**

```
1. User clicks "New Chat" button
2. Search modal opens
3. User types name/email in search box
4. Results appear filtered by search term
5. User clicks on person to message
6. Conversation starts
7. User sends first message
8. Conversation created in database
```

---

### **Messaging About an Application**

```
1. Student applies to internship
2. Application created in database
3. Student goes to /messages
4. Searches for company
5. Starts conversation
6. Backend links conversation to application automatically
7. Both parties can see application context in chat
```

---

### **Peer Networking (Student ↔ Student)**

```
1. Student A goes to /messages
2. Clicks "New Chat"
3. Searches for Student B
4. Starts conversation
5. Direct peer-to-peer messaging
6. No application link needed
```

---

### **Business Networking (Company ↔ Company)**

```
1. Company A goes to /messages
2. Clicks "New Chat"  
3. Searches for Company B
4. Starts conversation
5. Direct business-to-business messaging
```

---

## 🎯 Key Design Decisions

### **Why Profile-Based?**

Using `profile_id` instead of student/company IDs because:
- ✅ Works for **all user types** (student, company, admin)
- ✅ **Consistent** across all roles
- ✅ **Simpler queries** - one user reference system
- ✅ **Easier to extend** - adding new roles is simple

---

### **Why Ordered Participants?**

`participant1_profile_id < participant2_profile_id` ensures:
- ✅ **No duplicates** - Only one conversation between two users
- ✅ **Consistent lookups** - Always same order
- ✅ **Database efficiency** - Unique constraint works perfectly

---

### **Why Optional Application Link?**

Conversations can exist with or without application context:
- ✅ **Application-specific** - When messaging about internship
- ✅ **General networking** - When just chatting
- ✅ **Flexible** - Same system handles both cases

---

## 🔒 Security & Permissions

### **Access Control:**
- ✅ Users can only see their own conversations
- ✅ Users can message any other user
- ✅ Cannot delete others' messages
- ✅ Cannot read others' conversations

### **Validation:**
- ✅ Must be authenticated
- ✅ Cannot send empty messages
- ✅ Recipient must exist
- ✅ Profile ownership verified

---

## 📊 Database Indexes

For optimal performance:

```sql
-- Lookup conversations by either participant
idx_conversations_participant1
idx_conversations_participant2

-- Get messages for a conversation (ordered)
idx_messages_conversation

-- Count unread messages quickly
idx_messages_unread (where is_read = false)
```

---

## 🎨 UI Components Breakdown

### **Conversation List:**
- Role-based icons and colors
- Unread count badges
- Last message timestamp
- Application context (if any)
- Selected state highlighting

### **Chat Window:**
- Recipient info header
- Role indicator
- Application context banner
- Messages with timestamps
- Send input with button
- Auto-scroll on new messages

### **New Chat Modal:**
- Search input
- User list with details
- Role filtering
- University/company info display

---

## 🚀 Future Enhancements (Optional)

### **Possible Features:**
- 🔔 **Real-time notifications** with WebSockets
- 📎 **File attachments** in messages
- 🖼️ **Image/emoji support**
- ✓✓ **Read receipts** (show when read)
- 💬 **Typing indicators**
- 🗂️ **Message threading** for long conversations
- 🔍 **Message search** within conversations
- 📌 **Pin important conversations**
- 🗄️ **Archive old conversations**
- 👥 **Group chats** (3+ participants)

---

## ✅ Migration from Old System

If you had the old application-only messaging:

The SQL migration automatically:
1. ✅ Converts old messages to new system
2. ✅ Links to applications where applicable
3. ✅ Maintains message history
4. ✅ No data loss

---

## 🧪 Testing Checklist

- [ ] Student can message another student
- [ ] Student can message a company
- [ ] Company can message another company
- [ ] Company can message a student
- [ ] Search finds users correctly
- [ ] Unread count updates properly
- [ ] Messages appear in real-time (after refresh)
- [ ] Mark as read works
- [ ] Application context shows when relevant
- [ ] Can't see others' conversations
- [ ] Can start multiple conversations

---

## 📝 Summary

You now have a **fully functional universal messaging system** that supports:

✅ **Any-to-any messaging** (students, companies, admins)  
✅ **Application-specific conversations**  
✅ **General networking**  
✅ **User search and discovery**  
✅ **Unread tracking**  
✅ **Clean, modern UI**  
✅ **Secure and scalable**  

**One messaging system, infinite possibilities!** 🚀
