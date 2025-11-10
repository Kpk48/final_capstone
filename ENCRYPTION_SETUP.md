# 🔐 Quick Encryption Setup Guide

## ⚡ 3-Step Setup:

### **Step 1: Generate Encryption Key**

```bash
npx ts-node scripts/generate-encryption-key.ts
```

This creates a secure 256-bit encryption key and adds it to `.env.local`

### **Step 2: Verify .env.local**

Your `.env.local` should now contain:

```env
MESSAGE_ENCRYPTION_KEY=dGhpc2lzYXRlc3RrZXkxMjM0NTY3ODkwYWJjZGVmZ2hpams=
```

### **Step 3: Restart Server**

```bash
npm run dev
```

---

## ✅ That's It!

All messages are now automatically:
- 🔒 **Encrypted** when sent
- 🔓 **Decrypted** when read
- 🛡️ **Protected** in the database

---

## 🧪 Test It:

1. Log in and send a message
2. Check Supabase `messages` table
3. You should see encrypted gibberish like:
   ```
   xR7k3pT9mN4v8sW1qL5zP6hK2jF3dG8...
   ```
4. In your app, the message displays normally ✅

---

## ⚠️ Important:

- ✅ **DO** back up your encryption key
- ✅ **DO** use different keys for dev/production
- ❌ **DON'T** commit `.env.local` to git
- ❌ **DON'T** lose the key (messages become unreadable!)

---

## 📚 Full Documentation:

See `MESSAGE_ENCRYPTION_IMPLEMENTATION.md` for complete details.

---

**Your messages are now encrypted with bank-level security!** 🔐✨
