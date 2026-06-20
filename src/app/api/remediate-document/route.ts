import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (WITH DYNAMIC TEMPERATURE) ---
async function remediateDocumentWithResiliency(promptParts: any[], temperature: number) {
  // The Corrected Etomu Cascade
  const cascade = [
    "gemini-3.1-pro-preview", // Note the -preview suffix!
    "gemini-2.5-pro",
    "gemini-3.5-flash" 
  ];

  const MAX_RETRIES_PER_MODEL = 2; 

  for (let i = 0; i < cascade.length; i++) {
    const currentModelName = cascade[i];

    // Inject the dynamic temperature into the model configuration for this specific attempt
    const model = genAI.getGenerativeModel({ 
      model: currentModelName,
      generationConfig: { temperature } 
    });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Remediation - Attempt ${attempt}] Sending request to ${currentModelName} (Temp: ${temperature})...`);
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
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Determine the required creativity level based on the bypass type
    const temperature = type === "ai_bypass" ? 0.85 : 0.4;

    const mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    let specificRules = "";
    if (type === "ai_bypass") {
      specificRules = `
      1. REWRITE AI-FLAGGED TEXT: Visually scan the PDF. Focus ONLY on text with cyan, light blue, or purple background highlights. Rewrite these specific sections to sound entirely human and bypass AI detection systems.
      2. MAXIMIZE BURSTINESS: Drastically vary sentence lengths. Mix very short, punchy 5-word sentences with long, complex 30-word sentences.
      3. BANNED WORDS: Do NOT use recognizable AI words such as: delve, tapestry, crucial, underscore, multifaceted, paradigm, comprehensive, or testament.
      `;
    } else {
      specificRules = `
      1. REWRITE PLAGIARISM-FLAGGED TEXT: Visually scan the PDF. Focus ONLY on text with red, pink, orange, or yellow background highlights. Rewrite these specific sections to reduce n-gram similarity matching to 0% for originality checkers.
      2. STRUCTURAL DISRUPTION: Change sentence structures completely (active to passive, split/merge sentences) and replace common vocabulary with academic synonyms.
      3. CITATION PROTECTION: You MUST preserve all in-text citations exactly as they appear, including names and dates formatted as (Author, Year).
      `;
    }

    const prompt = `
      You are an expert academic editor, document reconstruction AI, and visual OCR system.
      I am providing you with a Turnitin Similarity Report PDF.
      
      YOUR TASK:
      Reconstruct the entire body of this document from start to finish. You must visually scan the document for colored highlights and apply the following STRICT RULES:
      
      ${specificRules}
      
      DOCUMENT RECONSTRUCTION RULES:
      4. PRESERVE UNFLAGGED TEXT EXACTLY: Any text with a plain white or transparent background is clean. You MUST output this text exactly as it is, word-for-word, to preserve the student's original work. Only apply rewrites to the highlighted sections mentioned above.
      5. REBUILD TABLES: If you encounter a table, you MUST reconstruct it perfectly using standard Markdown table format (using | and -). Do not write tables as plain text paragraphs.
      6. STRIP METADATA & ARTIFACTS: Completely ignore and remove page numbers, headers, footers, Turnitin report summaries, and similarity index pages at the end of the document. Only output the actual academic content.
      7. NO IMAGES: Ignore all images and graphs.
      8. FORMATTING: Use standard Markdown headings (###) for section titles. Use standard double line breaks for paragraphs.
      9. NO CONVERSATIONAL FILLER: Do not output "Here is the rewritten document" or any introduction. Your very first word must be the title or first word of the actual document.
    `;

    const promptParts = [
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ];

    // Process via our universal resiliency cascade, passing the required temperature
    const result = await remediateDocumentWithResiliency(promptParts, temperature);
    let remediatedText = result.response.text().trim();

    // 🚨 BULLETPROOF CLEANUP: Uses `{3}` to avoid literal backticks breaking the build
    remediatedText = remediatedText.replace(/`{3}(md|markdown)?/gi, "").replace(/`{3}/g, "").trim();
    remediatedText = remediatedText.replace(/^(Here is|Sure|Certainly|I have rewritten).*?\n/i, "").trim();

    return NextResponse.json({ success: true, remediatedText }, { status: 200 });

  } catch (error: any) {
    console.error("Error remediating document:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          error: "Our document reconstruction nodes are currently experiencing high traffic. Please try submitting the document again in a few seconds." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to process the document." }, { status: 500 });
  }
}
