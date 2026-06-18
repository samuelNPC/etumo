import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (MULTIMODAL DOCUMENT PARSING) ---
async function parseDocumentWithResiliency(promptParts: any[]) {
  // NEW CASCADE: Quality First (3.1 Pro), Speed Second (3.5 Flash), Legacy Last (2.5 Pro)
  const cascade = ["gemini-3.1-pro", "gemini-3.5-flash", "gemini-2.5-pro"];
  const MAX_RETRIES_PER_MODEL = 2; 

  for (let i = 0; i < cascade.length; i++) {
    const currentModelName = cascade[i];
    const model = genAI.getGenerativeModel({ model: currentModelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Doc Parsing - Attempt ${attempt}] Sending request to ${currentModelName}...`);
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
          // If it's a 400 Bad Request, API key issue, or context limit hit, throw it immediately
          throw error; 
        }
      }
    }
  }
  
  // If all models fail
  throw new Error("ALL_MODELS_EXHAUSTED");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing file or Project ID." }, { status: 400 });
    }

    const mimeType = file.type; 

    // --- STRICT GATEKEEPER: Prevent Google API Crashes ---
    const supportedTypes = [
      "application/pdf", 
      "text/plain", 
      "image/png", 
      "image/jpeg", 
      "image/jpg"
    ];

    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Microsoft Word documents are not supported by the AI. Please 'Save As PDF' and upload the PDF version." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 🚨 STRICT PROMPT: Enforces Appendices Extraction and JSON integrity
    const prompt = `
      You are an expert academic structuring AI. Analyze this uploaded university research guideline document.
      Extract the required research structure, chapter breakdowns, and formatting rules.
      
      CRITICAL STRUCTURAL EXTREMUM:
      You must look closely for required post-chapter items such as Appendices, Data Collection Instruments, Questionnaires, Interview Guides, Research Budgets, and Timeframes. Ensure these are explicitly appended to the end of the structure array.

      RULES:
      1. Return ONLY a raw JSON object. Do not include any conversational filler, introductory phrases, or markdown formatting (like \`\`\`json).
      2. The output MUST start with "{" and end with "}".
      3. Use sequential keys ('chapter1', 'chapter2', ..., 'appendices') for the structure array items.

      Expected JSON Format:
      {
        "formattingRules": "Extracted rules like font size, spacing, citation style (e.g., APA 7th). If not found, write 'Standard Academic Format'.",
        "structure": [
          { "key": "guidelines", "label": "1. Faculty Guidelines" },
          { "key": "preliminaryPages", "label": "2. Preliminary Pages" },
          { "key": "chapter1", "label": "3. Exact Name of First Chapter" },
          { "key": "appendices", "label": "X. Appendices (Questionnaires, Instruments & Budget)" }
        ]
      }
    `;

    const promptParts = [
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ];

    // 🚨 FAULT-TOLERANT ENGINE DESIGN: Process via our universal cascade
    const result = await parseDocumentWithResiliency(promptParts);
    let responseText = result.response.text().trim();

    // 🚨 SAFETY CLEANUP: Strips out markdown blocks and isolates the raw JSON string
    responseText = responseText.replace(/```(json)?/gi, "").replace(/```/g, "").trim();
    responseText = responseText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    let extractedGuidelines;
    try {
      extractedGuidelines = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI output as JSON. Cleaned payload:", responseText);
      return NextResponse.json(
        { error: "Structure parsing alignment anomaly. Please click apply again to re-sync." }, 
        { status: 500 }
      );
    }

    // Safety Loop: Guard workspace configuration properties so the component tracking flow doesn't break
    if (!extractedGuidelines.structure.find((s: any) => s.key === "guidelines")) {
        extractedGuidelines.structure.unshift({ key: "guidelines", label: "1. Faculty Guidelines" });
    }

    // Safety Loop: If the custom document somehow completely forgot appendices, force insert it at the end
    if (!extractedGuidelines.structure.find((s: any) => s.key === "appendices")) {
        extractedGuidelines.structure.push({ 
          key: "appendices", 
          label: `${extractedGuidelines.structure.length + 1}. Appendices (Instruments, Questionnaire & Budget)` 
        });
    }

    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      guidelines: {
        isCustomized: true,
        ...extractedGuidelines
      }
    });

    return NextResponse.json({ success: true, guidelines: extractedGuidelines }, { status: 200 });

  } catch (error: any) {
    console.error("General operational exception:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          error: "Academic compilation nodes are currently receiving heavy university traffic. Please click apply again in a few seconds." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal workspace error compiling data structure layout maps." },
      { status: 500 }
    );
  }
}
