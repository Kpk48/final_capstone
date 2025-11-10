import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI-powered topic analysis for internship postings
 * Dynamically generates topics based on job description
 * No predefined list - AI extracts whatever is relevant
 */

export interface TopicMatch {
  topic: string;
  category: string; // programming_language, framework, domain, tool, skill
  relevanceScore: number;
  reason: string;
}

/**
 * Analyze internship description using AI to dynamically extract relevant topics
 * AI generates topics - no predefined list
 */
export async function analyzeInternshipTopics(
  title: string,
  description: string,
  requirements?: string
): Promise<TopicMatch[]> {
  // If no API key, fall back to basic extraction
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not configured, using basic extraction');
    return basicTopicExtraction(title, description, requirements);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an AI that analyzes internship job postings and extracts relevant technical topics, skills, and technologies.

Analyze this internship posting and extract 5-10 key topics:

Title: ${title}
Description: ${description}
${requirements ? `Requirements: ${requirements}` : ''}

Extract topics that represent:
- Programming languages (Python, JavaScript, etc.)
- Frameworks (React, Django, etc.)
- Domains (Machine Learning, Web Development, etc.)
- Tools (Docker, AWS, Git, etc.)
- Key skills (Backend, Frontend, Full Stack, etc.)

Return ONLY a JSON array with this EXACT format:
[
  {
    "topic": "Python",
    "category": "programming_language",
    "relevanceScore": 0.95,
    "reason": "Primary language mentioned multiple times"
  }
]

Categories must be one of: programming_language, framework, domain, tool, skill

Be selective - only extract truly relevant topics (relevance > 0.4).
Return 5-10 topics maximum.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const topics: TopicMatch[] = JSON.parse(jsonMatch[0]);
      // Validate and filter
      return topics
        .filter(t => t.topic && t.category && t.relevanceScore >= 0.4)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('AI topic analysis failed:', error);
    // Fallback to basic extraction
    return basicTopicExtraction(title, description, requirements);
  }
}

/**
 * Fallback: Basic topic extraction using common patterns
 * When AI is not available
 */
function basicTopicExtraction(
  title: string,
  description: string,
  requirements?: string
): TopicMatch[] {
  const fullText = `${title} ${description} ${requirements || ''}`.toLowerCase();
  const matches: TopicMatch[] = [];

  // Common programming languages
  const languages = [
    'python', 'javascript', 'java', 'typescript', 'c++', 'c#', 'ruby',
    'go', 'rust', 'swift', 'kotlin', 'php', 'scala', 'r'
  ];

  // Common frameworks
  const frameworks = [
    'react', 'angular', 'vue', 'django', 'flask', 'spring', 'express',
    'node.js', 'laravel', 'rails', 'asp.net', 'flutter', 'react native'
  ];

  // Common domains/skills
  const domains = [
    'machine learning', 'web development', 'mobile development',
    'data science', 'devops', 'cloud computing', 'backend', 'frontend',
    'full stack', 'ai', 'blockchain', 'cybersecurity'
  ];

  // Common tools
  const tools = [
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'jenkins',
    'mongodb', 'postgresql', 'mysql', 'redis', 'graphql'
  ];

  // Check languages
  languages.forEach(lang => {
    const regex = new RegExp(`\\b${lang}\\b`, 'gi');
    const matchCount = (fullText.match(regex) || []).length;
    if (matchCount > 0) {
      let score = Math.min(matchCount * 0.3, 1.0);
      if (title.toLowerCase().includes(lang)) score = Math.min(score + 0.3, 1.0);
      matches.push({
        topic: lang.charAt(0).toUpperCase() + lang.slice(1),
        category: 'programming_language',
        relevanceScore: score,
        reason: `Mentioned ${matchCount} time${matchCount > 1 ? 's' : ''}`
      });
    }
  });

  // Check frameworks
  frameworks.forEach(fw => {
    const regex = new RegExp(`\\b${fw.replace('.', '\\.')}\\b`, 'gi');
    const matchCount = (fullText.match(regex) || []).length;
    if (matchCount > 0) {
      let score = Math.min(matchCount * 0.3, 1.0);
      if (title.toLowerCase().includes(fw)) score = Math.min(score + 0.3, 1.0);
      matches.push({
        topic: fw.charAt(0).toUpperCase() + fw.slice(1),
        category: 'framework',
        relevanceScore: score,
        reason: `Mentioned ${matchCount} time${matchCount > 1 ? 's' : ''}`
      });
    }
  });

  // Check domains
  domains.forEach(domain => {
    if (fullText.includes(domain)) {
      let score = 0.6;
      if (title.toLowerCase().includes(domain)) score = 0.9;
      matches.push({
        topic: domain.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        category: 'domain',
        relevanceScore: score,
        reason: 'Domain keyword found'
      });
    }
  });

  // Check tools
  tools.forEach(tool => {
    const regex = new RegExp(`\\b${tool}\\b`, 'gi');
    if (regex.test(fullText)) {
      matches.push({
        topic: tool.toUpperCase(),
        category: 'tool',
        relevanceScore: 0.5,
        reason: 'Tool mentioned'
      });
    }
  });

  return matches
    .filter(m => m.relevanceScore >= 0.4)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
}
