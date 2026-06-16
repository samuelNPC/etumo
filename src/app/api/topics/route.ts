import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Upgraded to the Pro model for the highest quality academic topic ideation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const { course, faculty, interest } = await req.json();

    // 🚨 STRICT PROMPT: Enforces JSON-only output and stops conversational hallucinations
    const prompt = `
      You are an expert academic research advisor for universities in Uganda.
      Generate exactly 3 structured, highly academic research topics for a final-year university student.
      
      Course: ${course || "General"}
      Faculty: ${faculty || "General"}
      Research Interest: ${interest}

      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. Return ONLY a raw JSON array of strings. Do not include any conversational filler, introductory phrases, or markdown formatting (like \`\`\`json).
      2. The output MUST start with "[" and end with "]".
      3. Topics must be specific, measurable, and appropriate for a bachelor's degree level research project in Uganda.

      Expected JSON Format:
      [
        "Topic 1: Specific impact of X on Y in context Z",
        "Topic 2: Evaluating the role of A in improving B",
        "Topic 3: Challenges and prospects of adopting C in D"
      ]
    `;

    const result = await model.generateContent(prompt);
    let textResponse = result.response.text().trim();

    // 🚨 SAFETY CLEANUP: Strips out markdown blocks and isolates the raw JSON array
    textResponse = textResponse.replace(/```(json)?/gi, "").replace(/```/g, "").trim();
    textResponse = textResponse.replace(/^(Here are|Sure|Certainly|I have).*?\n/i, "").trim();

    // Failsafe: Ensure we only parse the JSON array if the AI appended extra text
    const jsonStart = textResponse.indexOf('[');
    const jsonEnd = textResponse.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        textResponse = textResponse.substring(jsonStart, jsonEnd + 1);
    }

    let topics;
    try {
      topics = JSON.parse(textResponse);
      if (!Array.isArray(topics)) {
          throw new Error("Parsed JSON is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON array. Raw output:", textResponse);
      return NextResponse.json(
        { error: "The AI failed to format the topics correctly. Please try again." }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ topics }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating topics:", error);
    return NextResponse.json(
      { error: "Failed to generate research topics. Ensure your API key is correct and limits are not exceeded." },
      { status: 500 }
    );
  }
}
