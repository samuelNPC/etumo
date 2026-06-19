import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const defaultStructure = [
  { key: "guidelines", label: "1. Faculty Guidelines" },
  { key: "preliminaryPages", label: "2. Preliminary Pages" },
  { key: "chapter1", label: "3. Introduction" },
  { key: "chapter2", label: "4. Literature Review" },
  { key: "chapter3", label: "5. Methodology" },
  { key: "chapter4", label: "6. Data Presentation" },
  { key: "chapter5", label: "7. Conclusion" },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithResiliency(prompt: string) {
  const cascade = ["gemini-3.1-pro-preview", "gemini-2.5-pro", "gemini-3.5-flash"];
  const MAX_RETRIES_PER_MODEL = 2; 

  for (let i = 0; i < cascade.length; i++) {
    const currentModelName = cascade[i];
    const model = genAI.getGenerativeModel({ model: currentModelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Attempt ${attempt}] Sending request to ${currentModelName}...`);
        return await model.generateContent(prompt);
      } catch (error: any) {
        const isTrafficError = error.status === 503 || error.message?.includes("503") || error.message?.includes("high demand");
        if (isTrafficError) {
          if (attempt < MAX_RETRIES_PER_MODEL) {
            await sleep(1000 * attempt);
          } else break; 
        } else throw error; 
      }
    }
  }
  throw new Error("ALL_MODELS_EXHAUSTED");
}

function parseMarkdownToBlocks(text: string) {
    let cleanText = text;

    // 🚨 SURGICAL PURGE OF PRELIMINARY HALLUCINATIONS
    cleanText = cleanText.replace(/1\.0\s+Introduction[\s\S]*?(?=(?:#\s*)?(?:\*\*)?(?:1\.\d\s+)?DECLARATION)/i, '');
    cleanText = cleanText.replace(/(?:#\s*)?(?:\*\*)?(?:1\.\d\s+)?Title Page[\s\S]*?(?=(?:#\s*)?(?:\*\*)?(?:1\.\d\s+)?DECLARATION)/i, '');

    // Force exact preliminary headers to become pristine H1s, stripping any rogue numbers
    cleanText = cleanText.replace(/^(?:#+\s*)?(?:\*\*)?(?:\d+\.\d+\s+)?(DECLARATION|APPROVAL|DEDICATION|ACKNOWLEDGEMENT|ACKNOWLEDGEMENTS|ABSTRACT|LIST OF ABBREVIATIONS|LIST OF ACRONYMS)(?:\*\*)?\s*$/gim, '# $1');

    cleanText = cleanText.replace(/PRELIMINARY PAGES/gi, ''); 
    cleanText = cleanText.replace(/1\.\s*Preliminary Pages[^\n]*/gi, ''); 
    cleanText = cleanText.replace(/^(#\s*)?(\*\*)?APPENDICES(\*\*)?\s*$/gim, '');
    cleanText = cleanText.replace(/\[SYSTEM_AUTO_INDEX\]/g, '');
    cleanText = cleanText.replace(/\*\*(TABLE OF CONTENTS|LIST OF TABLES|LIST OF FIGURES|LIST OF ACRONYMS|DECLARATION|APPROVAL|DEDICATION|ACKNOWLEDGEMENT|ABSTRACT|CHAPTER.*?)\*\*/gim, '$1');
    cleanText = cleanText.replace(/^---\s*(.*)$/gim, '# $1');
    cleanText = cleanText.replace(/\s+##\s+/g, '\n\n## ');
    cleanText = cleanText.replace(/\s+#\s+/g, '\n\n# ');
    cleanText = cleanText.replace(/(CHAPTER\s+[A-Z]+.*?)\s*#*\s*(\d\.0\s+INTRODUCTION)/gi, '$1\n\n## $2');
    cleanText = cleanText.replace(/^(?:#\s*)?(CHAPTER\s+[A-Z]+[^\n]*)\s*\n+(?:\[PAGE BREAK\]\s*\n+)?(?=(?:#\s*)?CHAPTER\s+[A-Z]+)/gim, '');
    cleanText = cleanText.replace(/^(CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|\d+).*?)\s*$/gim, '# $1');

    const rawBlocks = cleanText.split(/\n\n+/);
    const parsedBlocks: any[] = [];
    let currentSection = "";

    for (let i = 0; i < rawBlocks.length; i++) {
        let blockText = rawBlocks[i].trim();
        if (!blockText || blockText.match(/^[-*]{3,}$/)) continue;

        if (blockText.includes("[PAGE BREAK]")) {
             parsedBlocks.push({ type: 'page-break', text: '' });
             continue;
        }

        const isTable = blockText.includes('|') && blockText.includes('\n') && /^[|\-\s:]+$/m.test(blockText);
        
        if (isTable) {
             if (["TABLE OF CONTENTS", "LIST OF TABLES", "LIST OF FIGURES", "LIST OF ACRONYMS"].includes(currentSection)) continue; 
             const lines = blockText.split('\n');
             const tableStart = lines.findIndex(l => l.trim().startsWith('|'));
             if (tableStart > 0) parsedBlocks.push({ type: 'p', text: lines.slice(0, tableStart).join('\n') });
             parsedBlocks.push({ type: 'table', text: lines.slice(tableStart).join('\n') });
             continue;
        }

        if (blockText.startsWith("# ")) {
             const h1Text = blockText.replace(/^#+\s*/, '').replace(/[#*]/g, '').trim();
             currentSection = h1Text.toUpperCase(); 

             let isDuplicate = false;
             for (let j = parsedBlocks.length - 1; j >= 0; j--) {
                 if (parsedBlocks[j].type === 'page-break') continue; 
                 if (parsedBlocks[j].type === 'h1') {
                     const prevUpper = parsedBlocks[j].text.toUpperCase();
                     if (prevUpper === currentSection || (prevUpper.startsWith("CHAPTER") && currentSection.startsWith("CHAPTER"))) {
                         isDuplicate = true;
                     }
                 }
                 break; 
             }
             if (isDuplicate) continue;

             parsedBlocks.push({ type: 'h1', text: h1Text });
        } else if (blockText.startsWith("## ")) {
             parsedBlocks.push({ type: 'h2', text: blockText.replace(/^#+\s*/, '').replace(/[#*]/g, '').trim() });
        } else if (blockText.startsWith("### ")) {
             parsedBlocks.push({ type: 'h3', text: blockText.replace(/^#+\s*/, '').replace(/[#*]/g, '').trim() });
        } else {
             const cleanPText = blockText.replace(/#/g, '').trim();
             if (!cleanPText) continue;

             if (/(?:\s|^)1\.\s+[A-Z].*?(?:\s)2\.\s+[A-Z]/g.test(cleanPText)) {
                 const parts = cleanPText.split(/(?=\s\d\.\s+[A-Z])/);
                 parts.forEach(part => { if (part.trim()) parsedBlocks.push({ type: 'list-item', text: part.trim() }); });
             } else {
                 const upperP = cleanPText.toUpperCase();
                 if (upperP === currentSection || (upperP.startsWith("CHAPTER") && currentSection.startsWith("CHAPTER"))) continue; 
                 parsedBlocks.push({ type: 'p', text: cleanPText });
             }
        }
    }
    return parsedBlocks;
}

export async function POST(req: Request) {
  try {
    const { projectId, chapterKey, feedback } = await req.json();

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const projectData = projectSnap.data();
    const { topic, course, faculty, content, guidelines } = projectData;

    const structure = guidelines?.isCustomized ? guidelines.structure : defaultStructure;
    const formattingRules = guidelines?.formattingRules || "Standard Academic Format";
    const currentIndex = structure.findIndex((c: { key: string }) => c.key === chapterKey);
    const chapterLabel = currentIndex !== -1 ? structure[currentIndex].label : chapterKey;

    let memoryContext = `University Faculty: ${faculty || "General"}\nCourse: ${course || "General"}\nResearch Topic: ${topic}`;

    if (currentIndex > 1) { 
      memoryContext += `\n\n--- PREVIOUSLY GENERATED CONTENT FOR CONTEXT ---\n`;
      for (let i = 1; i < currentIndex; i++) {
        const prevKey = structure[i].key;
        if (content && content[prevKey]) {
          let textVersion = "";
          if (Array.isArray(content[prevKey])) {
             textVersion = content[prevKey].map((b: any) => {
                 if (b.type === 'h1') return `# ${b.text}`;
                 if (b.type === 'h2') return `## ${b.text}`;
                 if (b.type === 'h3') return `### ${b.text}`;
                 return b.text;
             }).join('\n\n');
          } else {
             textVersion = content[prevKey];
          }
          memoryContext += `\n[${structure[i].label}]:\n${textVersion}\n`;
        }
      }
    }

    const feedbackInstruction = feedback 
      ? `\n\nURGENT SUPERVISOR CORRECTION: The user's supervisor rejected the previous draft and requested the following changes:\n"${feedback}"\nRewrite the entire section strictly adhering to this feedback.`
      : "";

    // 🚨 CONTEXT-AWARE RULES
    let specificRules = "";
    if (chapterKey === "preliminaryPages") {
      specificRules = `
      CRITICAL PRELIMINARY PAGES RULES:
      1. NO INTRODUCTION: Do not write any conversational intro (e.g., "This section encompasses...").
      2. NO TITLE PAGE: Do not generate a title page.
      3. NO NUMBERING: Do NOT use academic numbering (e.g., 1.1, 1.2) for these pages.
      4. EXACT HEADINGS: You MUST generate EXACTLY these sections in this exact order, each starting with a Level 1 Markdown heading (#):
         # DECLARATION
         (Write the declaration text here)
         # APPROVAL
         (Write the approval text here)
         # DEDICATION
         (Write the dedication text here)
         # ACKNOWLEDGEMENT
         (Write the acknowledgement text here)
         # ABSTRACT
         (Write the abstract text here)
      `;
    } else {
      specificRules = `
      1. FORMAL TITLE: YOU MUST start your response with the formal Chapter Title in capital letters (e.g., CHAPTER THREE: METHODOLOGY).
      2. INTRODUCTION HEADING: The very next line MUST be the introduction heading (e.g., 3.0 Introduction). Do not skip straight to X.2.
      3. ACADEMIC NUMBERING: Use standard academic numbering (1.1, 1.2, 1.3) for sub-headings.
      `;
    }

    const prompt = `
      You are an expert academic research writer drafting a final-year university project.
      Project Memory Context:
      ${memoryContext}

      Your explicit task: Write the exact content ONLY for the section named: "${chapterLabel.toUpperCase()}".
      ${feedbackInstruction}
      
      ${specificRules}
      
      GENERAL RULES:
      - NO INDEXING ALLOWED: Do NOT generate a Table of Contents, List of Tables, or List of Figures. These will be auto-generated by the system later. If the requested section implies these, output exactly this placeholder on a new line: [SYSTEM_AUTO_INDEX]
      - NO BULLET POINTS: Use standard academic paragraphs.
      - TABLES ALLOWED: When presenting structured data, you MUST use standard Markdown Tables.
      - CONCEPTUAL FRAMEWORKS & DIAGRAMS: You cannot draw visual diagrams. Write a detailed theoretical description paragraph, followed immediately by this exact placeholder on a new line: [INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE].
      - SINGLE ISOLATED SECTION: If the requested section is "Declaration", write ONLY the Declaration body.
      - CLEAN PARAGRAPHING: Do NOT output HTML tags.
      - FORMATTING: Apply the university formatting rules provided: ${formattingRules}
    `;

    const result = await generateWithResiliency(prompt);
    let generatedText = result.response.text().trim();

    // 🚨 The fix is here: strictly formatting the regex on a single continuous line.
    generatedText = generatedText.replace(/```(md|markdown|html)?/gi, "").replace(/```/g, "").trim();
    generatedText = generatedText.replace(/^(Here is|Sure|Certainly).*?\n/i, "").trim();

    const jsonBlocks = parseMarkdownToBlocks(generatedText);

    await updateDoc(projectRef, {
      [`content.${chapterKey}`]: jsonBlocks,
      progress: feedback ? projectData.progress : projectData.progress + 5 
    });

    return NextResponse.json({ chapterContent: jsonBlocks }, { status: 200 });

  } catch (error: any) {
    if (error.message === "ALL_MODELS_EXHAUSTED") return NextResponse.json({ code: "HIGH_TRAFFIC", error: "System is facing high traffic. Please try again." }, { status: 503 });
    return NextResponse.json({ error: "Failed to generate chapter" }, { status: 500 });
  }
}
