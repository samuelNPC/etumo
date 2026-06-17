import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Upgraded to Pro model: Perfectly handles massive document contexts and complex table extractions
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      You are an expert academic editor and document reconstruction AI.
      I am providing you with a Turnitin Similarity Report PDF.
      
      YOUR TASK:
      Reconstruct the entire body of this document from start to finish with the following STRICT RULES:
      
      1. REWRITE FLAGGED TEXT: Any text that appears to be highlighted/flagged for plagiarism or AI generation must be rewritten. Retain the exact academic meaning and citations, but change the vocabulary and sentence structure to achieve 0% similarity/AI detection.
      2. PRESERVE CLEAN TEXT: Any text that is standard and unflagged must be output exactly as it is.
      3. REBUILD TABLES: If you encounter a table, you MUST reconstruct it perfectly using standard Markdown table format (using | and -). Do not write tables as plain text paragraphs.
      4. STRIP METADATA & ARTIFACTS: Completely ignore and remove page numbers, headers, footers, Turnitin report summaries, and similarity index pages at the end of the document. Only output the actual academic content.
      5. NO IMAGES: Ignore all images and graphs.
      6. FORMATTING: Use standard Markdown headings (###) for section titles. Use standard double line breaks for paragraphs.
      7. NO CONVERSATIONAL FILLER: Do not output "Here is the rewritten document" or any introduction. Your very first word must be the title or first word of the actual document.
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    let remediatedText = result.response.text().trim();
    
    // Safety Cleanup: Strip out markdown blocks and conversational intro phrases
    remediatedText = remediatedText.replace(/```(md|markdown)?/gi, "").replace(/
```/g, "").trim();
    remediatedText = remediatedText.replace(/^(Here is|Sure|Certainly|I have rewritten).*?\n/i, "").trim();

    return NextResponse.json({ success: true, remediatedText }, { status: 200 });

  } catch (error) {
    console.error("Error remediating document:", error);
    return NextResponse.json({ error: "Failed to process the document." }, { status: 500 });
  }
}
