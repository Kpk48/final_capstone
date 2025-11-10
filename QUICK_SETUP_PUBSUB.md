# 🚀 Quick Setup: Topic & Company Following

## ⚡ 5-Minute Setup:

### **Step 1: Run Database Migration**
```sql
-- In Supabase SQL Editor
Run: enhanced_notification_system.sql
```
This creates:
- Topics table with 40+ predefined topics
- Following tables (topic_followers, company_followers)
- Notification triggers (auto-notify on new internships)
- Helper functions

### **Step 2: Add Gemini API Key (Optional)**
```env
# In .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```
Get key: https://makersuite.google.com/app/apikey

**Note:** Without API key, system uses keyword matching (works fine!)

### **Step 3: Restart Server**
```bash
npm run dev
```

---

## ✅ That's It! Test It:

### **As Student:**
```
1. Go to /student/following
2. Search "Python"
3. Click "Follow"
4. You're subscribed! 🔔
```

### **As Company:**
```
1. Post internship with "Python" in description
2. AI automatically tags it
3. Python followers get notified instantly! 📢
```

### **Verify:**
```
1. Check notification bell
2. Should see "New Python Opportunity!"
3. Click → View internship
```

---

## 🎯 What Happens Automatically:

```
Company Posts → AI Analyzes → Extracts Topics → Notifies Followers
        ↓              ↓              ↓               ↓
  "Python Dev"   Python(0.95)    Python topic    All Python
   Internship    Django(0.80)    Django topic    followers get
                                                  notifications!
```

---

## 📊 Available Features:

### **Students Can:**
- ✅ Search 40+ topics
- ✅ Follow topics (Python, React, ML, etc.)
- ✅ Follow companies
- ✅ Get instant notifications
- ✅ Unfollow anytime

### **System Auto:**
- ✅ AI analyzes internships
- ✅ Extracts relevant topics
- ✅ Notifies topic followers
- ✅ Notifies company followers
- ✅ No manual work needed!

---

## 🔧 Troubleshooting:

### **No Notifications?**
```
1. Check if topic follower exists:
   SELECT * FROM topic_followers;

2. Check if internship has topics:
   SELECT * FROM internship_topics;

3. Verify trigger is active:
   SELECT * FROM pg_trigger 
   WHERE tgname = 'trigger_notify_company_followers';
```

### **AI Not Working?**
```
- Check GEMINI_API_KEY in .env.local
- System falls back to keyword matching automatically
- Both methods work!
```

---

## 📖 Full Documentation:

See `TOPIC_COMPANY_FOLLOWING_PUBSUB.md` for complete details!

---

**Your intelligent notification system is ready!** 🎉
