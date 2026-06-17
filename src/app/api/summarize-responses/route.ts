import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const { responses, questionCount } = await req.json();

    if (!responses || responses.length === 0) {
      return NextResponse.json({ error: "Not enough data to analyze yet." }, { status: 400 });
    }

    const prompt = `
      You are an expert Data Analyst and Academic Researcher. 
      I am providing you with raw survey data collected from ${responses.length} respondents across ${questionCount} questions.
      
      YOUR TASK:
      Write a comprehensive "Data Presentation and Analysis" summary (suitable for Chapter 4 of a research report) based strictly on these responses.
      
      CRITICAL RULES:
      1. Identify the most common trends, majority sentiments, and any notable outliers.
      2. Use percentages where logical (e.g., "Out of the ${responses.length} respondents, approximately X% indicated...").
      3. Structure the output with clear, professional Markdown headings (###).
      4. Do NOT use conversational filler like "Here is the summary". Start directly with the analysis.
      
      RAW DATA TO ANALYZE:
      ${JSON.stringify(responses, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    let summaryText = result.response.text().trim();

    return NextResponse.json({ success: true, summary: summaryText }, { status: 200 });

  } catch (error) {
    console.error("Error generating AI summary:", error);
    return NextResponse.json({ error: "Failed to generate AI insights." }, { status: 500 });
  }
}
