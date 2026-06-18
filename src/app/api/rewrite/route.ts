import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (CONCURRENT CHUNK PROCESSING) ---
async function remediateChunkWithResiliency(prompt: string, temperature: number) {
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
        console.log(`[Chunk Rewrite - Attempt ${attempt}] Sending request to ${currentModelName} (Temp: ${temperature})...`);
        return await model.generateContent(prompt);
      } catch (error: any) {
        // Detect 503 Service Unavailable or High Demand errors
        const isTrafficError = 
          error.status === 503 || 
          error.message?.includes("503") || 
          error.message?.includes("high demand");
        
        if (isTrafficError) {
          if (attempt < MAX_RETRIES_PER_MODEL) {
            const delay = 1000 * attempt; 
            console.warn(`Traffic spike on ${currentModelName}. Retrying chunk in ${delay}ms...`);
            await sleep(delay);
          } else {
            console.warn(`Exhausted retries for ${currentModelName}. Cascading chunk to next model.`);
            break; // Move to the next model in the cascade array
          }
        } else {
          // If it's a 400 Bad Request, context limit, or API key issue, throw immediately
          throw error; 
        }
      }
    }
  }
  
  throw new Error("ALL_MODELS_EXHAUSTED");
}

export async function POST(req: Request) {
  try {
    const { flaggedTexts, type } = await req.json();

    if (!flaggedTexts || !Array.isArray(flaggedTexts) || flaggedTexts.length === 0) {
      return NextResponse.json({ error: "No text provided for rewriting." }, { status: 400 });
    }

    // Determine the model parameters based on the bypass type
    // AI bypass needs high temperature (unpredictability). Plagiarism bypass needs lower temperature (accuracy & citation preservation).
    const temperature = type === "ai_bypass" ? 0.85 : 0.4;

    // We process the array of flagged strings concurrently to speed up the response
    const rewritePromises = flaggedTexts.map(async (text) => {
      try {
        let prompt = "";

        if (type === "ai_bypass") {
          prompt = `
            You are an expert human academic editor. Rewrite the following text specifically to sound entirely human and bypass AI detection systems.
            
            CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
            1. Maximize Burstiness: Drastically vary sentence lengths. Mix very short, punchy 5-word sentences with long, complex 30-word sentences.
            2. Maximize Perplexity: Use less predictable vocabulary while maintaining a formal academic tone.
            3. Banned Words: Do NOT use recognizable AI words such as: delve, tapestry, crucial, underscore, multifaceted, paradigm, comprehensive, or testament.
            4. NO CONVERSATIONAL FILLER: Output ONLY the rewritten text. Do not say "Here is the rewritten text", "Sure", or "I have rewritten it". The very first word you output must be the beginning of the academic text.
            5. NO MARKDOWN: Do not output bolding, italics, or markdown code blocks.
            
            Text to rewrite:
            "${text}"
          `;
        } else if (type === "plagiarism_bypass") {
          prompt = `
            You are an expert academic editor. Rewrite the following text specifically to reduce n-gram similarity matching to 0% for originality checkers.
            
            CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
            1. Structural Disruption: Change the sentence structure completely. If active, make it passive (and vice versa). Split long sentences into two, or merge two short ones.
            2. Synonym Replacement: Swap common verbs and nouns with academic alternatives.
            3. Citation Protection: You MUST preserve all in-text citations exactly as they appear, including names and dates formatted as (Author, Year).
            4. NO CONVERSATIONAL FILLER: Output ONLY the rewritten text. Do not say "Here is the rewritten text", "Sure", or "I have rewritten it". The very first word you output must be the beginning of the academic text.
            5. NO MARKDOWN: Do not output bolding, italics, or markdown code blocks.
            
            Text to rewrite:
            "${text}"
          `;
        }

        // Process this specific chunk via our universal resiliency cascade
        const result = await remediateChunkWithResiliency(prompt, temperature);
        let rewrittenText = result.response.text().trim();

        // 🚨 SAFETY CLEANUP: Safely strips out markdown blocks using RegExp to prevent Vercel build errors
        rewrittenText = rewrittenText.replace(new RegExp("```(md|markdown|html|text)?", "gi"), "");
        rewrittenText = rewrittenText.replace(new RegExp("```", "g"), "").trim();
        rewrittenText = rewrittenText.replace(/^(Here is|Sure|Certainly|I have|Here's|The rewritten).*?\n/i, "").trim();

        return {
          original: text,
          rewritten: rewrittenText
        };
      } catch (innerError) {
        console.error("Error rewriting a specific chunk, gracefully degrading:", innerError);
        // Failsafe: If a single chunk completely exhausts the cascade, return the original text 
        // instead of crashing the entire Promise.all array.
        return {
          original: text,
          rewritten: text 
        };
      }
    });

    // Wait for all concurrent rewrites to finish
    const cleanedResults = await Promise.all(rewritePromises);

    return NextResponse.json({ success: true, cleanedData: cleanedResults }, { status: 200 });

  } catch (error) {
    console.error("Error in remediation engine:", error);
    return NextResponse.json(
      { error: "Failed to process the text rewriting pipeline." },
      { status: 500 }
    );
  }
}
