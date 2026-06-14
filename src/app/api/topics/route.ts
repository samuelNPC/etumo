import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const { course, faculty, interest } = await req.json();

    const prompt = `
      You are an expert academic research advisor for universities in Uganda.
      Generate exactly 3 structured academic research topics for a final-year university student.
      Course: ${course}
      Faculty: ${faculty}
      Research Interest: ${interest}

      Format the output strictly as a JSON array of strings. Do not include markdown formatting like \`\`\`json. Just return the raw array.
      Example: ["Topic 1", "Topic 2", "Topic 3"]
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().trim();
    
    // THE FIX: Strip out stubborn markdown wrappers before parsing
    const cleanText = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    const topics = JSON.parse(cleanText);

    return NextResponse.json({ topics }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating topics:", error);
    // Send a clear error message to the frontend
    return NextResponse.json(
      { error: "Failed to generate research topics. Ensure your API key is correct." },
      { status: 500 }
    );
  }
}
