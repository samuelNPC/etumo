import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 🚨 ADDED BACK: aiScore and aiFlaggedSections to the extraction schema
    const prompt = `
      You are an expert document analysis AI. Analyze this uploaded Turnitin Similarity Report PDF.
      Extract the core originality metrics, student details, and top matching sources.
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. Return ONLY a raw JSON object. Do not include any conversational filler, introductory phrases, or markdown formatting.
      2. The output MUST start with "{" and end with "}".
      
      Expected JSON Format:
      {
        "studentName": "Extracted student name (usually near the top or Document Details)",
        "overallSimilarity": 19,
        "aiScore": 37, 
        "aiFlaggedSections": 13,
        "issues": {
          "notCited": 0,
          "missingQuotations": 0
        },
        "topSources": [
          "Source Name 1 X%",
          "Source Name 2 Y%"
        ]
      }
    `;

    let result;
    try {
      const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      result = await proModel.generateContent([
        { inlineData: { data: base64Data, mimeType } },
        prompt,
      ]);
    } catch (apiError: any) {
      console.warn("Pro model overloaded or failed, falling back to Flash...", apiError.message);
      const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await flashModel.generateContent([
        { inlineData: { data: base64Data, mimeType } },
        prompt,
      ]);
    }

    let responseText = result.response.text().trim();

    responseText = responseText.replace(/`{3}(json)?/gi, "").replace(/`{3}/g, "").trim();
    responseText = responseText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    let extractedData;
    try {
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON. Raw output:", responseText);
      return NextResponse.json({ error: "Failed to format report correctly. Try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: extractedData }, { status: 200 });

  } catch (error) {
    console.error("Error parsing Turnitin PDF:", error);
    return NextResponse.json({ error: "Failed to parse the document. Ensure it is a valid PDF." }, { status: 500 });
  }
}
