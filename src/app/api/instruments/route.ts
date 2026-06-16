import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Upgraded to the Pro model for the highest quality academic structuring and question generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const { topic, course, type } = await req.json();

    // Type can be "questionnaire", "interview_guide", or "observation_checklist"
    const prompt = `
      You are an expert academic researcher designing data collection instruments.
      Create a highly structured ${type} for a final-year university research project.
      
      Research Topic: ${topic}
      Course: ${course || "General Academic Research"}
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. STRUCTURE: Include a brief introductory consent statement. Section A must be Demographic characteristics. Section B onwards must address core research questions (use a 5-point Likert scale format where applicable for questionnaires).
      2. NO CONVERSATIONAL FILLER: Do not write introductory phrases like "Here is your ${type}", "Sure", or "I have created the instrument". The very first word you output must be the title of the document.
      3. NO EXCESSIVE BOLDING: Use bolding (**) extremely sparingly. Do not bold entire questions or paragraphs. Only use it for main section headers (e.g., **SECTION A**).
      4. CLEAN FORMATTING: Do NOT output HTML tags. Do NOT use markdown code blocks (\`\`\`md). Use standard spacing, line breaks, and simple numbering.
      5. ACADEMIC TONE: Maintain a highly formal, unbiased, and professional research tone suitable for university-level field data collection.
    `;

    const result = await model.generateContent(prompt);
    let instrumentText = result.response.text().trim();

    // Safety Cleanup: Strip out conversational intro phrases and markdown blocks if the AI hallucinates them
    instrumentText = instrumentText.replace(/```(md|markdown|html|text)?/gi, "").replace(/```/g, "").trim();
    instrumentText = instrumentText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();

    return NextResponse.json({ instrument: instrumentText }, { status: 200 });
  } catch (error) {
    console.error("Error generating instrument:", error);
    return NextResponse.json({ error: "Failed to generate research instrument." }, { status: 500 });
  }
}
