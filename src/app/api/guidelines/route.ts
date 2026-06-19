import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Upgraded to the maximum quality Pro model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing file or project ID" }, { status: 400 });
    }

    // 1. Convert the PDF file to Base64 to feed natively into Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // 2. The Extraction Prompt enforcing Strict JSON Output
    const prompt = `
      Analyze this university faculty guidelines document for a final year academic research project.
      Extract the exact chapter structure required and any specific formatting rules (e.g., font size, spacing, citation style).
      
      You MUST respond with a valid JSON object using this exact schema:
      {
        "isCustomized": true,
        "formattingRules": "String summarizing font, spacing, and citation requirements.",
        "structure": [
          { "key": "preliminaryPages", "label": "Exact name for Preliminary Pages" },
          { "key": "chapter1", "label": "Exact name for Chapter 1" }
          // ... continue for all required chapters and appendices
        ]
      }
      
      CRITICAL RULES:
      1. Use camelCase for the "key" (e.g., "chapter1", "chapter2", "appendices").
      2. Ensure the "label" matches exactly what the university calls it (e.g., "CHAPTER ONE: INTRODUCTION" or "1.0 INTRODUCTION").
      3. ALWAYS include a key for "preliminaryPages" at the beginning and "appendices" at the end if they are implied or mentioned.
      4. Return ONLY the JSON object. Do not include markdown formatting blocks like \`\`\`json.
    `;

    // 3. Send to Gemini 2.5 Pro
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type || "application/pdf",
        },
      },
    ]);

    let jsonText = result.response.text().trim();
    
    // 4. Safety Cleanup: Stripping markdown blocks (written safely to avoid copy-paste line breaks)
    jsonText = jsonText.split("```json").join("").split("```").join("").trim();

    // Parse the extracted JSON
    const parsedGuidelines = JSON.parse(jsonText);

    // 5. Auto-Save the structure directly to the user's project in Firebase
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      guidelines: parsedGuidelines,
    });

    return NextResponse.json({ success: true, guidelines: parsedGuidelines }, { status: 200 });

  } catch (error: any) {
    console.error("Error parsing guidelines:", error);

    // 🚨 CATCH GEMINI HIGH TRAFFIC / 503 ERRORS
    if (
      error.status === 503 || 
      (error.message && error.message.includes("503")) ||
      (error.message && error.message.includes("high demand"))
    ) {
      return NextResponse.json(
        { 
          code: "HIGH_TRAFFIC", 
          error: "Our System is currently facing high traffic while reading your document. Please try again." 
        }, 
        { status: 503 }
      );
    }

    // Default fallback for generic parsing errors
    return NextResponse.json({ error: "Failed to parse guidelines document. Ensure it is a clear PDF." }, { status: 500 });
  }
}
