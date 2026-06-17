import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Upgraded to the maximum quality Pro model for production!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Fallback structure in case guidelines weren't uploaded
const defaultStructure = [
  { key: "guidelines", label: "1. Faculty Guidelines" },
  { key: "preliminaryPages", label: "2. Preliminary Pages" },
  { key: "chapter1", label: "3. Introduction" },
  { key: "chapter2", label: "4. Literature Review" },
  { key: "chapter3", label: "5. Methodology" },
  { key: "chapter4", label: "6. Data Presentation" },
  { key: "chapter5", label: "7. Conclusion" },
];

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
    const { topic, course, faculty, content, guidelines } = projectData;

    // 2. Extract Dynamic Structure & Formatting
    const structure = guidelines?.isCustomized ? guidelines.structure : defaultStructure;
    const formattingRules = guidelines?.formattingRules || "Standard Academic Format";

    // Find where we currently are in the document
    const currentIndex = structure.findIndex((c: { key: string }) => c.key === chapterKey);
    const chapterLabel = currentIndex !== -1 ? structure[currentIndex].label : chapterKey;

    // 3. Build the DYNAMIC Context Memory Layer
    let memoryContext = `
      University Faculty: ${faculty || "General"}
      Course: ${course || "General"}
      Research Topic: ${topic}
    `;

    // Automatically inject ALL prior generated chapters in sequential order
    if (currentIndex > 1) { 
      memoryContext += `\n\n--- PREVIOUSLY GENERATED CONTENT FOR CONTEXT ---\n`;
      for (let i = 1; i < currentIndex; i++) {
        const prevKey = structure[i].key;
        if (content && content[prevKey]) {
          memoryContext += `\n[${structure[i].label}]:\n${content[prevKey]}\n`;
        }
      }
    }

    // 4. The Master Unified Prompt (Strict Academic Paragraph Guardrails Added)
    const prompt = `
      You are an expert academic research writer drafting a final-year university project.
      
      Project Memory Context:
      ${memoryContext}

      Your explicit task: Write the exact content ONLY for the section named: "${chapterLabel.toUpperCase()}".
      
      CRITICAL RULES - YOU MUST OBEY THESE STRICTLY:
      1. FORMAL TITLE: YOU MUST start your response with the formal Chapter Title in capital letters (e.g., CHAPTER THREE: METHODOLOGY or exactly what "${chapterLabel.toUpperCase()}" implies).
      2. INTRODUCTION HEADING: The very next line MUST be the introduction heading (e.g., 3.0 Introduction or 3.1 Introduction) before you write the first paragraph. Do not skip straight to X.2.
      3. ACADEMIC NUMBERING: Use standard academic numbering (1.1, 1.2, 1.3) for all subsequent sub-headings to maintain a logical flow.
      4. NO BULLET POINTS: Do not use bullet points or dashed lists under any circumstances. Present all information in cohesive, standard academic paragraphs. If a sequential list is strictly required, use formal numbering (1., 2., 3.).
      5. NO EXCESSIVE BOLDING: Use bolding sparingly. Do not bold entire paragraphs. Use it only for main headings.
      6. SINGLE ISOLATED SECTION: If the requested section is "Declaration", write ONLY the Declaration body. Do not group multiple preliminary pages together. 
      7. CLEAN PARAGRAPHING: Do NOT output HTML tags (<p>, <br>, <b>, <span>). Use standard double line breaks for paragraphs. 
      8. NO CONVERSATIONAL FILLER: Do not write introductory phrases like "Here is the content for your research". The very first word you output must be the Chapter Title.
      9. ACADEMIC TONE: Ensure the tone is formal and rigorous. For body chapters, cite theoretical literature where appropriate. 
      10. FORMATTING: Apply the university formatting rules provided: ${formattingRules}
      11. PLACEHOLDERS: Use standard brackets like [Student Name] or [University Name] where specific personal data is missing.
    `;

    // 5. Generate the Chapter
    const result = await model.generateContent(prompt);
    let generatedText = result.response.text().trim();

    // 6. Safety Cleanup: Strip out conversational intro phrases
    generatedText = generatedText.replace(/```(md|markdown|html)?/gi, "").replace(/```/g, "").trim();
    generatedText = generatedText.replace(/^(Here is|Sure|Certainly).*?\n/i, "").trim();

    // 🚨 NEW: Strict Markdown Cleanup (Removes ALL asterisks to enforce clean paragraph text)
    generatedText = generatedText.replace(/\*/g, ""); 

    // 7. Auto-Save back to Firestore & Update Progress
    await updateDoc(projectRef, {
      [`content.${chapterKey}`]: generatedText,
      progress: projectData.progress + 5 
    });

    return NextResponse.json({ chapterContent: generatedText }, { status: 200 });

  } catch (error) {
    console.error("Error generating chapter:", error);
    return NextResponse.json({ error: "Failed to generate chapter" }, { status: 500 });
  }
}
