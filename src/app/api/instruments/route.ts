import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (QUALITY FIRST) ---
async function generateInstrumentWithResiliency(prompt: string) {
  // The Corrected Etomu Cascade
const cascade = [
  "gemini-3.1-pro-preview", // Note the -preview suffix!
  "gemini-2.5-pro",
  "gemini-3.5-flash" 
];

  
  // Limit to 2 retries per model to prevent Serverless Function Timeouts
  const MAX_RETRIES_PER_MODEL = 2; 

  for (let i = 0; i < cascade.length; i++) {
    const currentModelName = cascade[i];
    const model = genAI.getGenerativeModel({ model: currentModelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Instrument Gen - Attempt ${attempt}] Sending request to ${currentModelName}...`);
        return await model.generateContent(prompt);
      } catch (error: any) {
        // Detect 503 Service Unavailable or High Demand errors
        const isTrafficError = 
          error.status === 503 || 
          error.message?.includes("503") || 
          error.message?.includes("high demand");
        
        if (isTrafficError) {
          if (attempt < MAX_RETRIES_PER_MODEL) {
            // Wait 1 second on the first fail, then retry
            const delay = 1000 * attempt; 
            console.warn(`Traffic spike on ${currentModelName}. Retrying in ${delay}ms...`);
            await sleep(delay);
          } else {
            console.warn(`Exhausted retries for ${currentModelName}. Cascading to next model.`);
            break; // Breaks the inner loop, moving to the next model in the cascade array
          }
        } else {
          // If it's a 400 Bad Request, API key issue, or context limit hit, throw it immediately
          throw error; 
        }
      }
    }
  }
  
  // If the code reaches this point, all 3 models failed and Google's entire network is struggling
  throw new Error("ALL_MODELS_EXHAUSTED");
}

export async function POST(req: Request) {
  try {
    const { topic, course, type } = await req.json();

    // Type can be "questionnaire", "interview_guide", or "observation_checklist"
    const prompt = `
      You are an expert academic researcher designing data collection instruments.
      Create a highly structured ${type} for a final-year university research project.
      
      Research Topic: ${topic}
      Course: ${course || "General Academic Research"}
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. STRUCTURE: Include a brief introductory consent statement. Section A must be Demographic characteristics. Section B onwards must address core research questions (use a 5-point Likert scale format where applicable for questionnaires).
      2. NO CONVERSATIONAL FILLER: Do not write introductory phrases like "Here is your ${type}", "Sure", or "I have created the instrument". The very first word you output must be the title of the document.
      3. NO EXCESSIVE BOLDING: Use bolding (**) extremely sparingly. Do not bold entire questions or paragraphs. Only use it for main section headers (e.g., **SECTION A**).
      4. CLEAN FORMATTING: Do NOT output HTML tags. Do NOT use markdown code blocks (\`\`\`md). Use standard spacing, line breaks, and simple numbering.
      5. ACADEMIC TONE: Maintain a highly formal, unbiased, and professional research tone suitable for university-level field data collection.
    `;

    // Generate the Instrument using the Resilient Fallback Engine
    const result = await generateInstrumentWithResiliency(prompt);
    let instrumentText = result.response.text().trim();

    // Safety Cleanup: Strip out conversational intro phrases and markdown blocks if the AI hallucinates them
    instrumentText = instrumentText.replace(/```(md|markdown|html|text)?/gi, "").replace(/```/g, "").trim();
    instrumentText = instrumentText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();

    return NextResponse.json({ instrument: instrumentText }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating instrument:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          code: "HIGH_TRAFFIC", 
          error: "Our System is currently facing exceptionally high traffic while trying to generate your instrument. Please try again in a few minutes." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to generate research instrument." }, { status: 500 });
  }
}
