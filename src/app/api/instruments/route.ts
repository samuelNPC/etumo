import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const { topic, course, type } = await req.json();

    // Type can be "questionnaire", "interview_guide", or "observation_checklist"
    const prompt = `
      You are an academic researcher designing data collection instruments.
      Create a highly structured ${type} for a final-year research project.
      
      Topic: ${topic}
      Course: ${course}
      
      Rules:
      1. Include a brief introductory consent statement.
      2. Section A: Demographic characteristics (age, gender, education, etc.).
      3. Section B: Core research questions using a 5-point Likert scale format where applicable.
      4. Format clearly in plain text.
    `;

    const result = await model.generateContent(prompt);
    const instrumentText = result.response.text().trim();

    return NextResponse.json({ instrument: instrumentText }, { status: 200 });
  } catch (error) {
    console.error("Error generating instrument:", error);
    return NextResponse.json({ error: "Failed to generate research instrument." }, { status: 500 });
  }
}
