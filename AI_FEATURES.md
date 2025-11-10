# AI Features Setup (Optional)

## Overview
SkillSync includes optional AI-powered features for intelligent student-internship matching using embeddings and semantic search.

## Current Status
✅ **The app works WITHOUT AI features configured**
- Student profiles can be saved
- Company profiles can be saved
- Internships can be posted
- Applications can be submitted

⚠️ **AI features require additional setup:**
- Resume semantic search
- AI-powered internship recommendations
- Intelligent student-internship matching

## Enable AI Features

### 1. Get a Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add to Environment Variables
Edit your `.env.local` file and add:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

### 3. Restart Your Dev Server
```bash
npm run dev
```

## What Happens Without AI Features?
- Profile saves will show: "✅ Profile saved! (AI features unavailable)"
- The app functions normally for all other features
- No errors or crashes
- AI recommendations page will show a message about configuration

## What AI Features Enable
Once configured, you'll have:
- **Semantic Resume Search**: Find students by natural language queries
- **Smart Recommendations**: AI suggests best-fit internships for students
- **Intelligent Matching**: Companies get ranked student matches based on skills and experience

## Troubleshooting

### "GEMINI_API_KEY not configured" message
- Add the API key to `.env.local`
- Restart your development server
- Clear browser cache if needed

### Embeddings still failing
- Verify API key is valid
- Check Google AI Studio quota limits
- Ensure `text-embedding-004` model is available in your region

## Cost Considerations
- Google Gemini API has a **free tier** with generous limits
- Embedding generation is typically very low cost
- Monitor usage in [Google AI Studio](https://makersuite.google.com/)

---

**Note**: This is completely optional. Your SkillSync platform works perfectly without AI features!
