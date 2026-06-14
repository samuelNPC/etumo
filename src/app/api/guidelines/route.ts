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
    const mimeType = file.type; // handles application/pdf, image/jpeg, image/png

    const prompt = `
      You are an academic structuring AI. Analyze this uploaded university research guideline document.
      Extract the required research structure and formatting rules.
      
      Return ONLY a raw JSON object with this exact structure (no markdown tags):
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

    const responseText = result.response.text().trim();
    const extractedGuidelines = JSON.parse(responseText);

    // Save the dynamic structure directly to the student's project in Firestore
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      guidelines: {
        isCustomized: true,
        ...extractedGuidelines
      }
    });

    return NextResponse.json({ success: true, guidelines: extractedGuidelines }, { status: 200 });

  } catch (error) {
    console.error("Error parsing guidelines:", error);
    return NextResponse.json(
      { error: "Failed to parse the document. Ensure it is a valid PDF or Image." },
      { status: 500 }
    );
  }
}
