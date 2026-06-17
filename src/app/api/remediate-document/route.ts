import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const temperature = type === "ai_bypass" ? 0.85 : 0.4;
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { temperature } 
    });

    const mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    let specificRules = "";
    if (type === "ai_bypass") {
      specificRules = `
      1. REWRITE FOR AI BYPASS: Rewrite the document to sound entirely human and bypass AI detection systems.
      2. MAXIMIZE BURSTINESS: Drastically vary sentence lengths. Mix very short, punchy 5-word sentences with long, complex 30-word sentences.
      3. BANNED WORDS: Do NOT use recognizable AI words such as: delve, tapestry, crucial, underscore, multifaceted, paradigm, comprehensive, or testament.
      `;
    } else {
      specificRules = `
      1. REWRITE FOR PLAGIARISM BYPASS: Rewrite flagged text to reduce n-gram similarity matching to 0% for originality checkers.
      2. STRUCTURAL DISRUPTION: Change sentence structures completely (active to passive, split/merge sentences) and replace common vocabulary with academic synonyms.
      3. CITATION PROTECTION: You MUST preserve all in-text citations exactly as they appear, including names and dates formatted as (Author, Year).
      `;
    }

    const prompt = `
      You are an expert academic editor and document reconstruction AI.
      I am providing you with a Turnitin Similarity Report PDF.
      
      YOUR TASK:
      Reconstruct the entire body of this document from start to finish with the following STRICT RULES:
      
      ${specificRules}
      
      DOCUMENT RECONSTRUCTION RULES:
      4. PRESERVE CLEAN TEXT: Any text that is standard and unflagged must be output exactly as it is to preserve meaning.
      5. REBUILD TABLES: If you encounter a table, you MUST reconstruct it perfectly using standard Markdown table format (using | and -). Do not write tables as plain text paragraphs.
      6. STRIP METADATA & ARTIFACTS: Completely ignore and remove page numbers, headers, footers, Turnitin report summaries, and similarity index pages at the end of the document. Only output the actual academic content.
      7. NO IMAGES: Ignore all images and graphs.
      8. FORMATTING: Use standard Markdown headings (###) for section titles. Use standard double line breaks for paragraphs.
      9. NO CONVERSATIONAL FILLER: Do not output "Here is the rewritten document" or any introduction. Your very first word must be the title or first word of the actual document.
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    let remediatedText = result.response.text().trim();
    
    // 🚨 BULLETPROOF CLEANUP: Uses `{3}` to avoid literal backticks breaking the build
    remediatedText = remediatedText.replace(/`{3}(md|markdown)?/gi, "").replace(/`{3}/g, "").trim();
    remediatedText = remediatedText.replace(/^(Here is|Sure|Certainly|I have rewritten).*?\n/i, "").trim();

    return NextResponse.json({ success: true, remediatedText }, { status: 200 });

  } catch (error) {
    console.error("Error remediating document:", error);
    return NextResponse.json({ error: "Failed to process the document." }, { status: 500 });
  }
}
