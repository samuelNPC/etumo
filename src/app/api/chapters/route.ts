import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Keeping Flash for testing, switch to "gemini-2.5-pro" for production!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    if (currentIndex > 1) { // Index 0 is usually 'guidelines', which has no content
      memoryContext += `\n\n--- PREVIOUSLY GENERATED CONTENT FOR CONTEXT ---\n`;
      for (let i = 1; i < currentIndex; i++) {
        const prevKey = structure[i].key;
        if (content && content[prevKey]) {
          memoryContext += `\n[${structure[i].label}]:\n${content[prevKey]}\n`;
        }
      }
    }

    // 4. Determine Intent (Preliminary Pages vs Body Chapters)
    let prompt = "";
    const isPrelim = chapterKey.toLowerCase().includes("prelim") || chapterLabel.toLowerCase().includes("prelim") || chapterKey.toLowerCase().includes("title") || chapterKey.toLowerCase().includes("cover");

    if (isPrelim) {
      prompt = `
        You are an expert academic formatting assistant. 
        The user needs the content for the ${chapterLabel.toUpperCase()} for this research:
        ${memoryContext}
        
        INSTRUCTIONS:
        - Write out a professional, clean Title/Cover Page layout.
        - Include placeholders for the student's name, registration number, faculty, and date.
        - Add standard academic preliminary text sections such as a formal Declaration statement, Dedication section, and Acknowledgments section.
        - Apply the formatting rules: ${formattingRules}
        - DO NOT write chapter body paragraphs, introductions, or literature reviews yet. Only generate structural preliminary page text.
      `;
    } else {
      prompt = `
        You are an expert academic research writer drafting a final-year university project.
        
        Here is the established project memory (Use this to ensure smooth transitions and avoid repeating information):
        ${memoryContext}

        Your task: Write a highly structured, deep, and academic draft for the section: "${chapterLabel.toUpperCase()}".
        
        INSTRUCTIONS:
        - Ensure the tone is formal, rigorous, and aligns perfectly with the topic and prior chapters.
        - Apply the university formatting rules provided: ${formattingRules}
        - Do not generate generic placeholders. Write the actual academic content, citing theoretical literature where appropriate.
        - Format the output in plain text with clear paragraph spacing and standard academic headings. Do not use markdown wrappers like \`\`\`md.
      `;
    }

    // 5. Generate the Chapter
    const result = await model.generateContent(prompt);
    let generatedText = result.response.text().trim();
    
    // Safety cleanup in case Gemini ignores the "No markdown wrappers" rule
    generatedText = generatedText.replace(/```(md|markdown)?/gi, "").replace(/```/g, "").trim();

    // 6. Auto-Save back to Firestore & Update Progress
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
