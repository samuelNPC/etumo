import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Using the Pro model for maximum quality multimodal reasoning
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const chapterKey = formData.get("chapterKey") as string;
    const feedbackText = formData.get("feedbackText") as string;
    const imageFile = formData.get("image") as File | null;

    // 1. Fetch the current project and the specific chapter to rewrite
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const projectData = projectSnap.data();
    const currentChapterContent = projectData.content[chapterKey];
    if (!currentChapterContent) {
      return NextResponse.json({ error: "No chapter content exists to correct." }, { status: 400 });
    }

    // 2. Build the multi-modal AI payload with Strict Formatting Guardrails
    const promptParts: any[] = [
      `You are an expert academic editor. A university supervisor has provided feedback on a student's research chapter.
      
      Original Chapter Content:
      ${currentChapterContent}
      
      Supervisor Feedback:
      ${feedbackText || "See attached image for corrections."}
      
      Your explicit task: Rewrite the chapter to completely satisfy the supervisor's corrections.
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. NO CHAPTER TITLES OR HEADINGS AT THE TOP: Do NOT output the chapter title at the beginning of your response. Start immediately with the first paragraph of the body text.
      2. NO EXCESSIVE BOLDING: Use bolding (**) extremely sparingly. Do not bold entire sentences or paragraphs.
      3. CLEAN PARAGRAPHING: Do NOT output HTML tags. Use standard double line breaks for paragraphs. Do not use markdown code blocks (\`\`\`md).
      4. NO CONVERSATIONAL FILLER: Do not write introductory phrases like "Here is the corrected chapter", "Sure", or "I have applied the changes". The very first word you output must be the actual beginning of the academic document text.
      5. ACADEMIC TONE: Maintain the formal academic tone, preserve existing citations, and ensure the structure remains intact unless the feedback explicitly asks you to change it.`
    ];

    // If the student uploaded a picture of their marked-up paper, add it to the vision payload
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: imageFile.type,
        },
      });
    }

    // 3. Generate the corrected rewrite
    const result = await model.generateContent(promptParts);
    let correctedText = result.response.text().trim();

    // 4. Safety Cleanup: Strip out conversational intro phrases and markdown blocks if the AI hallucinates them
    correctedText = correctedText.replace(/```(md|markdown|html)?/gi, "").replace(/```/g, "").trim();
    correctedText = correctedText.replace(/^(Here is|Sure|Certainly|I have).*?\n/i, "").trim();

    // 5. Update the Firestore database with the new version
    await updateDoc(projectRef, {
      [`content.${chapterKey}`]: correctedText,
    });

    return NextResponse.json({ success: true, updatedContent: correctedText }, { status: 200 });

  } catch (error) {
    console.error("Error applying corrections:", error);
    return NextResponse.json({ error: "Failed to apply supervisor feedback." }, { status: 500 });
  }
}
