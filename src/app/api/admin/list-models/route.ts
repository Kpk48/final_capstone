import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Debug endpoint to test which Gemini model works
 * Visit: /api/admin/list-models
 */
export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY not configured" 
      }, { status: 503 });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test common model names
    const modelsToTest = [
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-pro",
      "gemini-1.0-pro",
      "models/gemini-1.5-pro-latest",
      "models/gemini-1.5-pro",
      "models/gemini-pro",
    ];
    
    const results = [];
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        results.push({
          model: modelName,
          status: "✅ WORKS",
          response: result.response.text().substring(0, 50) + "..."
        });
        // If one works, we can stop
        break;
      } catch (err: any) {
        results.push({
          model: modelName,
          status: "❌ Failed",
          error: err.message?.substring(0, 100) || "Unknown error"
        });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      results,
      recommendation: "Use the first model that shows '✅ WORKS' status"
    });
  } catch (err: any) {
    console.error("Model test error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to test models"
    }, { status: 500 });
  }
}
