import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Upgraded to Pro model: Perfectly extracts complex data directly from PDFs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const mimeType = file.type;
    if (mimeType !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a valid Turnitin PDF report." }, { status: 400 });
    }

    // Convert the uploaded PDF into a format Gemini can read directly
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 🚨 STRICT PROMPT: Enforces JSON-only output and stops conversational hallucinations
    const prompt = `
      You are an expert document analysis AI. Analyze this uploaded Turnitin Similarity Report PDF.
      Extract the core originality metrics, student details, and top matching sources.
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. Return ONLY a raw JSON object. Do not include any conversational filler, introductory phrases, or markdown formatting (like \`\`\`json).
      2. The output MUST start with "{" and end with "}".
      
      Expected JSON Format:
      {
        "studentName": "Extracted student name (usually near the top or Document Details)",
        "overallSimilarity": 19, // Provide the integer value of the overall similarity percentage
        "issues": {
          "notCited": 0, // Integer value of 'Not Cited or Quoted' matches (if not found, use 0)
          "missingQuotations": 0 // Integer value of 'Missing Quotations' (if not found, use 0)
        },
        "topSources": [
          "Source Name 1 X%",
          "Source Name 2 Y%"
        ] // Array of strings (max 5) of the top sources with their percentages
      }
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    let responseText = result.response.text().trim();

    // 🚨 SAFETY CLEANUP: Strips out markdown blocks and isolates the raw JSON string
    responseText = responseText.replace(/```(json)?/gi, "").replace(/```/g, "").trim();
    responseText = responseText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();
    
    // Failsafe: Ensure we only parse the JSON part if the AI appended extra text at the end
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    let extractedData;
    try {
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON. Raw output:", responseText);
      return NextResponse.json(
        { error: "The AI failed to format the Turnitin report correctly. Please try again." }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: extractedData }, { status: 200 });

  } catch (error) {
    console.error("Error parsing Turnitin PDF:", error);
    return NextResponse.json({ error: "Failed to parse the document. Ensure it is a valid Turnitin PDF." }, { status: 500 });
  }
}
