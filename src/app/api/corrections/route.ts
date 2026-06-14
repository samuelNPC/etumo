import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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

    const currentChapterContent = projectSnap.data().content[chapterKey];
    if (!currentChapterContent) {
      return NextResponse.json({ error: "No chapter content exists to correct." }, { status: 400 });
    }

    // 2. Build the multi-modal AI payload
    const promptParts: any[] = [
      `You are an expert academic editor. A university supervisor has provided feedback on a student's research chapter.
      
      Original Chapter Content:
      ${currentChapterContent}
      
      Supervisor Feedback:
      ${feedbackText || "See attached image for corrections."}
      
      Your Task: Rewrite the chapter to completely satisfy the supervisor's corrections. Maintain the formal academic tone, preserve existing citations, and ensure the structure remains intact unless the feedback explicitly asks you to change it. Output plain text with standard paragraph spacing. Do not use markdown blocks.`
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
    const correctedText = result.response.text().trim();

    // 4. Update the Firestore database with the new version
    await updateDoc(projectRef, {
      [`content.${chapterKey}`]: correctedText,
    });

    return NextResponse.json({ success: true, updatedContent: correctedText }, { status: 200 });

  } catch (error) {
    console.error("Error applying corrections:", error);
    return NextResponse.json({ error: "Failed to apply supervisor feedback." }, { status: 500 });
  }
}
