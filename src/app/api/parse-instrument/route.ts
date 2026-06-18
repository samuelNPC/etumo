import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (MULTIMODAL INSTRUMENT PARSING) ---
async function parseInstrumentWithResiliency(promptParts: any[]) {
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
        console.log(`[Instrument Parse - Attempt ${attempt}] Sending request to ${currentModelName}...`);
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
    const supportedTypes = ["application/pdf", "text/plain", "image/png", "image/jpeg", "image/jpg"];

    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Word documents (.docx) are not supported. Please 'Save As PDF' and upload the PDF version." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 🚨 UPDATED PROMPT: Now extracts the full text for the frontend preview
    const prompt = `
      You are an expert academic research assistant. Analyze this uploaded university data collection instrument (questionnaire or interview guide).
      
      1. Count the total number of primary questions asked. 
      2. Count the total number of distinct sections (e.g., Section A, Section B).
      3. Extract the entire questionnaire beautifully formatted in standard Markdown.
      
      CRITICAL RULES:
      1. Return ONLY a raw JSON object. Do not include markdown (like \`\`\`json) or conversational text.
      
      Expected JSON Format:
      {
        "questionCount": 14,
        "sectionCount": 3,
        "previewText": "### SECTION A: DEMOGRAPHICS\\n\\n1. What is your age?\\n2. What is your gender?"
      }
    `;

    const promptParts = [
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ];

    // Process via our universal resiliency cascade
    const result = await parseInstrumentWithResiliency(promptParts);
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
      console.error("Failed to parse AI output as JSON. Cleaned payload:", responseText);
      return NextResponse.json(
        { error: "Failed to read the document structure correctly. Please try again." }, 
        { status: 500 }
      );
    }

    // Generate a unique ID and save a draft to the database
    const instrumentRef = await addDoc(collection(db, "instruments"), {
      status: "pending_payment",
      questionCount: extractedData.questionCount || 0,
      sectionCount: extractedData.sectionCount || 0,
      previewText: extractedData.previewText || "",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      instrumentId: instrumentRef.id,
      ...extractedData 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error parsing instrument:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          error: "Our document parsing nodes are currently experiencing high traffic. Please try uploading your instrument again in a few seconds." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to analyze the document. Please try again." }, { status: 500 });
  }
}
