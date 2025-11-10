# 🔍 RAG Search Testing Guide

## 📋 **Prerequisites**

Before RAG search works, you need:
1. ✅ Valid `GEMINI_API_KEY` in `.env.local`
2. ✅ `pgvector` extension enabled in Supabase
3. ✅ Embeddings in the database (created when students save profiles)

---

## 🧪 **Step-by-Step Testing**

### **Step 1: Create Test Embeddings**

#### **Option A: As a Student (Recommended)**
1. **Go to:** `http://localhost:3000/student/profile`
2. **Fill in the "Resume Text" field** with something like:
   ```
   Experienced React developer with 3 years of experience.
   Skilled in TypeScript, Next.js, and TailwindCSS.
   Built multiple web applications using modern frameworks.
   Strong knowledge of JavaScript and Node.js.
   ```
3. **Click "Save"**
4. **Check for success message** - should say "Profile saved successfully!"

#### **Option B: Multiple Test Students**
Create 2-3 students with different skills:

**Student 1 - Frontend Developer:**
```
Frontend developer specializing in React and Vue.js.
Experience with responsive design and CSS frameworks.
Built e-commerce websites and dashboards.
```

**Student 2 - Backend Developer:**
```
Backend engineer proficient in Python and Node.js.
Experience with REST APIs, databases, and microservices.
Built scalable server applications.
```

**Student 3 - Full Stack:**
```
Full stack developer with Java and Angular experience.
Database design with PostgreSQL and MongoDB.
DevOps knowledge with Docker and AWS.
```

---

### **Step 2: Verify Embeddings Were Created**

**Check via Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. When you save a student profile, you should NOT see:
   - ❌ "Failed to generate embeddings"
   - ❌ "Embeddings error"

**Or check the database directly:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as embedding_count FROM embeddings;
SELECT owner_type, COUNT(*) FROM embeddings GROUP BY owner_type;
```

You should see rows in the `embeddings` table.

---

### **Step 3: Test RAG Search**

#### **Go to RAG Tools Page**
1. **Navigate to:** `http://localhost:3000/admin/tools`
2. You should see the RAG Search Tools page

#### **Try These Search Queries:**

**Query 1: General Search**
```
React developer
```
**Expected:** Should find students who mentioned React

**Query 2: Skill-Based Search**
```
Python backend engineer
```
**Expected:** Should find students with Python/backend experience

**Query 3: Technology Stack**
```
TypeScript and Node.js
```
**Expected:** Should find students with these technologies

**Query 4: Natural Language**
```
Looking for someone with 3+ years experience in web development
```
**Expected:** Should find experienced developers

---

## 🎯 **What Should Happen**

### **✅ Success Response:**
```
Found 3 results out of 5 total embeddings
```
- Shows search results with similarity scores
- Displays content chunks
- Results are ranked by relevance

### **⚠️ Warning Messages:**

**No Embeddings:**
```
No embeddings found in database. Students need to save their profiles with resume text.
```
**Action:** Create student profiles with resume text

**Semantic Search Unavailable:**
```
Showing all 5 embeddings. Run SEMANTIC_SEARCH_FUNCTION.sql in Supabase.
```
**Action:** Run the SQL function (optional - shows all if missing)

---

## 🔧 **Troubleshooting**

### **Problem: "No embeddings found"**
**Cause:** No students have saved profiles yet
**Solution:** 
1. Register as a student at `/register`
2. Login and go to `/student/profile`
3. Add resume text
4. Click Save

---

### **Problem: "AI features unavailable"**
**Cause:** `GEMINI_API_KEY` not configured or invalid
**Solution:**
1. Check `.env.local` file
2. Make sure it has: `GEMINI_API_KEY=your_actual_key`
3. Restart dev server

---

### **Problem: "Showing all embeddings" (not searching)**
**Cause:** `match_embeddings` SQL function not created
**Solution:** Run this in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  owner_type text,
  owner_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.owner_type,
    embeddings.owner_id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity,
    embeddings.metadata
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_embeddings TO service_role;
```

---

### **Problem: pgvector error**
**Cause:** pgvector extension not enabled
**Solution:** Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Recreate embeddings table
DROP TABLE IF EXISTS embeddings CASCADE;

CREATE TABLE embeddings (
  id BIGSERIAL PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 📊 **Understanding Results**

### **Result Format:**
```json
{
  "id": 1,
  "owner_type": "student_resume",
  "owner_id": "uuid-here",
  "content": "Experienced React developer...",
  "similarity": 0.87,
  "metadata": null
}
```

### **Similarity Score:**
- **0.8 - 1.0**: Very relevant match
- **0.5 - 0.8**: Somewhat relevant
- **0.3 - 0.5**: Loosely related
- **< 0.3**: Not shown (filtered out)

---

## 🎓 **Example Search Session**

### **1. Create Test Data**
```
Login as Student 1
Resume: "React and TypeScript developer with 5 years experience"
Save Profile ✅

Login as Student 2  
Resume: "Python data scientist with machine learning skills"
Save Profile ✅

Login as Student 3
Resume: "Full stack engineer using React, Node.js, and PostgreSQL"
Save Profile ✅
```

### **2. Search as Admin**
```
Go to /admin/tools

Search: "React developer"
Results: Student 1 (0.92), Student 3 (0.78)

Search: "Python machine learning"
Results: Student 2 (0.89)

Search: "Full stack with databases"
Results: Student 3 (0.85), Student 1 (0.45)
```

---

## 🚀 **Quick Start Checklist**

- [ ] GEMINI_API_KEY in .env.local
- [ ] pgvector enabled in Supabase
- [ ] Created 2-3 student profiles
- [ ] Added resume text to each profile
- [ ] Saved profiles successfully
- [ ] No embedding errors in console
- [ ] Went to /admin/tools
- [ ] Searched for keywords
- [ ] Got results!

---

## 💡 **Tips**

1. **Use natural language** - The AI understands context
2. **Be specific** - "React developer with 3+ years" works better than just "developer"
3. **Multiple keywords** - "Python Flask REST API" finds more specific matches
4. **Try variations** - If no results, try simpler terms

---

## ❓ **Still Not Working?**

### **Debug Checklist:**

1. **Check browser console for errors**
2. **Verify API key works:**
   ```
   Visit: http://localhost:3000/api/admin/list-models
   Should NOT return 404 errors
   ```

3. **Check database:**
   ```sql
   SELECT COUNT(*) FROM embeddings;
   -- Should return > 0
   ```

4. **Test embedding creation:**
   - Save a student profile
   - Check Network tab in DevTools
   - POST to /api/embeddings/ingest should return 200

5. **Restart dev server** after any .env changes

---

## 🎉 **Success!**

When everything works, you'll see:
- ✅ Search results ranked by relevance
- ✅ Similarity scores displayed
- ✅ Content previews shown
- ✅ Fast search performance

Your RAG search is now fully operational! 🚀
