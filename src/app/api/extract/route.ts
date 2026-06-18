import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini using the server-side key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (VISUAL OCR PARSING) ---
async function extractHighlightsWithResiliency(promptParts: any[]) {
  // THE ETOMU CASCADE: Top-tier intelligence first, stable fallback, fast cheap fallback
  const cascade = [
    "gemini-3.1-pro-preview", 
    "gemini-2.5-pro", 
    "gemini-3.5-flash"
  ];
  
  const MAX_RETRIES_PER_MODEL = 2; 

  for (let i = 0; i < cascade.length; i++) {
    const currentModelName = cascade[i];
    const model = genAI.getGenerativeModel({ model: currentModelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Visual OCR - Attempt ${attempt}] Sending request to ${currentModelName}...`);
        return await model.generateContent(promptParts);
      } catch (error: any) {
        // Detect 503 Service Unavailable, High Demand, or 429 Rate Limit errors
        const isTrafficError = 
          error.status === 503 || 
          error.status === 429 ||
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
          // If it's a 400 Bad Request or API key issue, throw immediately
          throw error; 
        }
      }
    }
  }
  
  throw new Error("ALL_MODELS_EXHAUSTED");
}

export async function POST(req: Request) {
  try {
    // 1. Grab the uploaded PDF from the form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No Turnitin report uploaded." }, { status: 400 });
    }

    // 2. Convert the PDF into a format Gemini can read visually
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 3. The Extraction Prompt Engine
    const prompt = `
      You are an expert OCR and document analysis AI system.
      Analyze this uploaded Turnitin Similarity and AI Detection report visually.
      
      Your strict task is to read the background colors of the text and extract the exact highlighted strings.
      
      Extraction Rules:
      1. Extract any text with a red, orange, pink, or yellow background into an array named "plagiarism_flagged".
      2. Extract any text with a cyan, light blue, or purple background into an array named "ai_flagged".
      3. Ignore all plain text with a white or transparent background.
      4. Return ONLY a raw JSON object containing these two arrays. Do not wrap it in markdown blockquotes like \`\`\`json.
      
      Expected Output Format:
      {
        "plagiarism_flagged": ["flagged sentence 1", "flagged sentence 2"],
        "ai_flagged": ["flagged sentence 3", "flagged sentence 4"]
      }
    `;

    const promptParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
      prompt,
    ];

    // 4. Fire the multi-modal request through the resiliency engine
    const result = await extractHighlightsWithResiliency(promptParts);
    let responseText = result.response.text().trim();

    // 5. BULLETPROOF CLEANUP: Strip out accidental markdown or conversational filler
    responseText = responseText.replace(/`{3}(json)?/gi, "").replace(/`{3}/g, "").trim();
    responseText = responseText.replace(/^(Here is|Sure|Certainly|I have extracted).*?\n/i, "").trim();

    // Isolate just the JSON object in case there's lingering text
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    // Parse the cleaned JSON payload
    let extractedHighlights;
    try {
      extractedHighlights = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse visual OCR output as JSON. Raw output:", responseText);
      return NextResponse.json(
        { error: "Failed to accurately read the document highlights. Please try uploading the file again." }, 
        { status: 500 }
      );
    }

    // Return the clean data to the frontend
    return NextResponse.json({ success: true, data: extractedHighlights }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing Turnitin report:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          error: "Our visual processing nodes are currently experiencing high traffic. Please try again in a few seconds." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to parse the document highlights. Ensure it is a valid PDF." },
      { status: 500 }
    );
  }
}
