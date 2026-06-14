import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini using the server-side key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// We strictly use the Pro model here because reading PDF background colors requires deep visual reasoning
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    // 1. Grab the uploaded PDF from the form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No Turnitin report uploaded." }, { status: 400 });
    }

    // 2. Convert the PDF into a format Gemini can read visually
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 3. The Extraction Prompt Engine
    const prompt = `
      You are an expert OCR and document analysis AI system.
      Analyze this uploaded Turnitin Similarity and AI Detection report visually.
      
      Your strict task is to read the background colors of the text and extract the exact highlighted strings.
      
      Extraction Rules:
      1. Extract any text with a red, orange, pink, or yellow background into an array named "plagiarism_flagged".
      2. Extract any text with a cyan, light blue, or purple background into an array named "ai_flagged".
      3. Ignore all plain text with a white or transparent background.
      4. Return ONLY a raw JSON object containing these two arrays. Do not wrap it in markdown blockquotes like \`\`\`json.
      
      Expected Output Format:
      {
        "plagiarism_flagged": ["flagged sentence 1", "flagged sentence 2"],
        "ai_flagged": ["flagged sentence 3", "flagged sentence 4"]
      }
    `;

    // 4. Fire the multi-modal request
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);

    // 5. Parse the raw JSON payload returned by Gemini
    const responseText = result.response.text().trim();
    const extractedHighlights = JSON.parse(responseText);

    // Return the clean data to the frontend
    return NextResponse.json({ success: true, data: extractedHighlights }, { status: 200 });

  } catch (error) {
    console.error("Error processing Turnitin report:", error);
    return NextResponse.json(
      { error: "Failed to parse the document highlights. Ensure it is a valid PDF." },
      { status: 500 }
    );
  }
}
