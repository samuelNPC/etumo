import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Initialize Gemini 2.5 Pro for deep reasoning and long-form academic writing
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function POST(req: Request) {
  try {
    const { projectId, chapterKey } = await req.json();

    // 1. Fetch the project state from Firestore
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();
    const { topic, course, faculty, content } = projectData;

    // 2. Build the Context Memory Layer
    // This ensures the AI remembers exactly what it already wrote.
    let memoryContext = `
      University Faculty: ${faculty}
      Course: ${course}
      Research Topic: ${topic}
    `;

    // Inject prior chapters into the context depending on what is being generated
    if (chapterKey === "chapter2" && content.chapter1) {
      memoryContext += `\nPrevious Chapter (Introduction):\n${content.chapter1}`;
    } else if (chapterKey === "chapter3" && content.chapter2) {
      memoryContext += `\nPrevious Chapter (Literature Review):\n${content.chapter2}`;
    }

    // 3. The Enforced Prompt Structure
    const prompt = `
      You are an expert academic research writer. 
      You are drafting a section for a final-year university student's research project in Uganda.
      
      Here is the established project memory:
      ${memoryContext}

      Your task: Write a highly structured, academic, and comprehensive ${chapterKey.toUpperCase()}.
      Ensure the tone is formal and aligns perfectly with the topic and prior chapters. 
      Format the output in plain text with clear paragraph spacing and standard academic headings. Do not use markdown wrappers like \`\`\`md.
    `;

    // 4. Generate the Chapter
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text().trim();

    // 5. Auto-Save back to Firestore & Update Progress
    await updateDoc(projectRef, {
      [`content.${chapterKey}`]: generatedText,
      progress: projectData.progress + 15 // Bump the progress bar
    });

    return NextResponse.json({ chapterContent: generatedText }, { status: 200 });

  } catch (error) {
    console.error("Error generating chapter:", error);
    return NextResponse.json({ error: "Failed to generate chapter" }, { status: 500 });
  }
}
