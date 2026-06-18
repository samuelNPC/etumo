import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (TURNITIN PDF EXTRACTION) ---
async function parseTurnitinWithResiliency(promptParts: any[]) {
  // The Corrected Etomu Cascade
const cascade = [
  "gemini-3.1-pro-preview", // Note the -preview suffix!
  "gemini-2.5-pro",
  "gemini-3.5-flash" 
];

  const MAX_RETRIES_PER_MODEL = 2; 

  for (let i = 0; i < cascade.length; i++) {
    const currentModelName = cascade[i];
    const model = genAI.getGenerativeModel({ model: currentModelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Turnitin Parse - Attempt ${attempt}] Sending request to ${currentModelName}...`);
        return await model.generateContent(promptParts);
      } catch (error: any) {
        // Detect 503 Service Unavailable or High Demand errors
        const isTrafficError = 
          error.status === 503 || 
          error.message?.includes("503") || 
          error.message?.includes("high demand");
        
        if (isTrafficError) {
          if (attempt < MAX_RETRIES_PER_MODEL) {
            const delay = 1000 * attempt; 
            console.warn(`Traffic spike on ${currentModelName}. Retrying in ${delay}ms...`);
            await sleep(delay);
          } else {
            console.warn(`Exhausted retries for ${currentModelName}. Cascading to next model.`);
            break; // Move to the next model in the cascade array
          }
        } else {
          // If it's a 400 Bad Request, API key issue, or file format issue, throw immediately
          throw error; 
        }
      }
    }
  }
  
  throw new Error("ALL_MODELS_EXHAUSTED");
}

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

    const promptParts = [
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ];

    // Process via our universal resiliency cascade
    const result = await parseTurnitinWithResiliency(promptParts);
    let responseText = result.response.text().trim();

    // 🚨 BULLETPROOF CLEANUP
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

  } catch (error: any) {
    console.error("Error parsing Turnitin PDF:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          error: "Our report analysis nodes are currently experiencing high traffic. Please try uploading the report again in a few seconds." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to parse the document. Ensure it is a valid PDF." }, { status: 500 });
  }
}
