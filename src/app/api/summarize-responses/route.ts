import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize AI without binding a specific model globally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility to pause execution for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- THE RESILIENCY ENGINE (DATA ANALYSIS) ---
async function generateSummaryWithResiliency(prompt: string) {
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
        console.log(`[Data Analysis - Attempt ${attempt}] Sending request to ${currentModelName}...`);
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
            console.warn(`Traffic spike on ${currentModelName}. Retrying in ${delay}ms...`);
            await sleep(delay);
          } else {
            console.warn(`Exhausted retries for ${currentModelName}. Cascading to next model.`);
            break; // Move to the next model in the cascade array
          }
        } else {
          // If it's a context limit hit or API key issue, throw immediately
          throw error; 
        }
      }
    }
  }
  
  throw new Error("ALL_MODELS_EXHAUSTED");
}

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

    // Process via our universal resiliency cascade
    const result = await generateSummaryWithResiliency(prompt);
    let summaryText = result.response.text().trim();

    // 🚨 BULLETPROOF CLEANUP: Strip out accidental code blocks or conversational filler
    summaryText = summaryText.replace(/`{3}(md|markdown)?/gi, "").replace(/`{3}/g, "").trim();
    summaryText = summaryText.replace(/^(Here is|Sure|Certainly|I have analyzed).*?\n/i, "").trim();

    return NextResponse.json({ success: true, summary: summaryText }, { status: 200 });

  } catch (error: any) {
    console.error("Error generating AI summary:", error);

    // CATCH THE CUSTOM CASCADE FAILURE
    if (error.message === "ALL_MODELS_EXHAUSTED") {
      return NextResponse.json(
        { 
          error: "Our data analysis nodes are currently experiencing high traffic. Please try generating the summary again in a few seconds." 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to generate AI insights." }, { status: 500 });
  }
}
