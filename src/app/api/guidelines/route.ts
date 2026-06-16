import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Upgraded to the highest quality Pro model for deep document reasoning
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

    // 🚨 STRICT PROMPT: Enforces JSON-only output and stops conversational hallucinations
    const prompt = `
      You are an expert academic structuring AI. Analyze this uploaded university research guideline document.
      Extract the required research structure and formatting rules.
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. Return ONLY a raw JSON object. Do not include any conversational filler, introductory phrases, or markdown formatting (like \`\`\`json).
      2. The output MUST start with "{" and end with "}".
      3. Always ensure keys in the structure array are formatted sequentially like 'chapter1', 'chapter2', etc. 
      4. Include preliminary pages if mentioned.

      Expected JSON Format:
      {
        "formattingRules": "Extracted rules like font size, spacing, citation style (e.g., APA 7th). If not found, write 'Standard Academic Format'.",
        "structure": [
          { "key": "guidelines", "label": "1. Faculty Guidelines" },
          { "key": "preliminaryPages", "label": "2. Preliminary Pages" },
          { "key": "chapter1", "label": "3. Exact Name of First Chapter" }
        ]
      }
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    let responseText = result.response.text().trim();

    // 🚨 SAFETY CLEANUP: Strips out markdown blocks and isolates the raw JSON string
    responseText = responseText.replace(/```(json)?/gi, "").replace(/```/g, "").trim();
    responseText = responseText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();
    
    // Failsafe: Ensure we only parse the JSON part if the AI appended extra text at the end
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

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

    // Protect the UI loop: Ensure the "guidelines" key is always present so the user can upload them
    if (!extractedGuidelines.structure.find((s: any) => s.key === "guidelines")) {
        extractedGuidelines.structure.unshift({ key: "guidelines", label: "1. Faculty Guidelines" });
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
    console.error("Backend processing error:", error);

    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return NextResponse.json(
        { error: "AI Model not found. Please check your API configuration." },
        { status: 500 }
      );
    }

    if (error.message?.includes("429") || error.message?.includes("Quota")) {
      return NextResponse.json(
        { error: "AI Rate limit exceeded. Please wait a few seconds and try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to read the document. Ensure it is not corrupted and try again." },
      { status: 500 }
    );
  }
}
