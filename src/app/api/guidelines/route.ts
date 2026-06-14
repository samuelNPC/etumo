import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing file or Project ID." }, { status: 400 });
    }

    // Convert file to base64 for Gemini Vision
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    
    // Gemini inlineData strictly supports application/pdf, text/plain, and images.
    const mimeType = file.type; 

    const prompt = `
      You are an academic structuring AI. Analyze this uploaded university research guideline document.
      Extract the required research structure and formatting rules.
      
      Return ONLY a raw JSON object with this exact structure (no markdown tags, no backticks, no code blocks):
      {
        "formattingRules": "Extracted rules like font size, spacing, citation style (e.g., APA 7th). If not found, write 'Standard Academic Format'.",
        "structure": [
          { "key": "chapter1", "label": "Exact Name of First Chapter" },
          { "key": "chapter2", "label": "Exact Name of Second Chapter" }
        ]
      }
      Always ensure keys are formatted sequentially like 'chapter1', 'chapter2', etc. Include preliminary pages if mentioned.
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    let responseText = result.response.text().trim();

    // --- THE FIX: Aggressively strip Markdown formatting ---
    // AI models frequently ignore the "no markdown" rule. This prevents JSON.parse from crashing.
    responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let extractedGuidelines;
    try {
      extractedGuidelines = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON. Raw output:", responseText);
      return NextResponse.json(
        { error: "The AI failed to format the response correctly. Please try clicking apply again." }, 
        { status: 500 }
      );
    }

    // Save the dynamic structure directly to the student's project in Firestore
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      guidelines: {
        isCustomized: true,
        ...extractedGuidelines
      }
    });

    return NextResponse.json({ success: true, guidelines: extractedGuidelines }, { status: 200 });

  } catch (error: any) {
    console.error("Backend processing error:", error);
    
    // Provide dynamic error messaging depending on what caused the crash
    const errorMessage = error.message?.includes("MIME type") || error.message?.includes("supported")
      ? "Unsupported file type. Please save your document as a PDF or TXT file and try again."
      : "Failed to read the document. Ensure it is not corrupted and try again.";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
