import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// Using the Pro model for deep document reasoning and counting
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const mimeType = file.type;
    const supportedTypes = ["application/pdf", "text/plain", "image/png", "image/jpeg", "image/jpg"];

    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Word documents (.docx) are not supported. Please 'Save As PDF' and upload the PDF version." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 🚨 STRICT PROMPT: Count the questions and sections
    const prompt = `
      You are an expert academic research assistant. Analyze this uploaded university data collection instrument (questionnaire or interview guide).
      
      Count the total number of primary questions asked. 
      Count the total number of distinct sections (e.g., Section A, Section B).
      
      CRITICAL RULES:
      1. Return ONLY a raw JSON object. Do not include markdown (like \`\`\`json) or conversational text.
      
      Expected JSON Format:
      {
        "questionCount": 14,
        "sectionCount": 3
      }
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    let responseText = result.response.text().trim();
    
    // Safety Cleanup: Safely formatted to prevent line-break errors during copy-pasting
    responseText = responseText.replace(/```(json)?/gi, "");
    responseText = responseText.replace(/```/g, "").trim();
    responseText = responseText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    const extractedData = JSON.parse(responseText);

    // Generate a unique ID and save a draft to the database
    const instrumentRef = await addDoc(collection(db, "instruments"), {
      status: "pending_payment",
      questionCount: extractedData.questionCount || 0,
      sectionCount: extractedData.sectionCount || 0,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      instrumentId: instrumentRef.id,
      ...extractedData 
    }, { status: 200 });

  } catch (error) {
    console.error("Error parsing instrument:", error);
    return NextResponse.json({ error: "Failed to analyze the document. Please try again." }, { status: 500 });
  }
}
