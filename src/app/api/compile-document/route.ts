import { NextResponse } from "next/server";
import * as docx from "docx";
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, chapterKey, isFullDocument, structure } = body;

    if (!projectId || !chapterKey || !structure) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = docSnap.data();
    const contentData = data.content || {};

    const docChildren: docx.Paragraph[] = [];

    // 🚨 HIGH-QUALITY PARSER: Converts raw AI Markdown into native Microsoft Word formatting
    const processTextToParagraphs = (text: string) => {
      const lines = text.split("\n");
      const paragraphs: docx.Paragraph[] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        
        // 1. Handle Empty Lines
        if (trimmed === "") {
          paragraphs.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
          return;
        }

        // 2. Handle Markdown Headers (e.g., ### Chapter One)
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          // Strip out any bold stars the AI might have accidentally left inside the header
          const contentText = headerMatch[2].replace(/\*/g, ""); 
          
          let headingLevel;
          switch(level) {
              case 1: headingLevel = docx.HeadingLevel.HEADING_1; break;
              case 2: headingLevel = docx.HeadingLevel.HEADING_2; break;
              case 3: headingLevel = docx.HeadingLevel.HEADING_3; break;
              default: headingLevel = docx.HeadingLevel.HEADING_4; break;
          }

          paragraphs.push(
            new docx.Paragraph({
              text: contentText.toUpperCase(),
              heading: headingLevel,
              spacing: { before: 400, after: 200 },
            })
          );
          return;
        }

        // 3. Handle Markdown Tables (Aligns them using Monospace font)
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          paragraphs.push(
            new docx.Paragraph({
              children: [new docx.TextRun({ text: trimmed, font: "Courier New", size: 20 })],
              spacing: { after: 0, line: 240 },
              alignment: docx.AlignmentType.LEFT,
            })
          );
          return;
        }

        // 4. Handle Bullet Points
        const isBullet = /^[\*\-]\s+(.*)/.exec(trimmed);
        let contentText = trimmed;
        let bulletInfo = undefined;

        if (isBullet) {
           contentText = isBullet[1];
           bulletInfo = { level: 0 }; // Native Word bullet point
        }

        // 5. Inline Formatting Parser (Bold & Italics)
        const runs: docx.TextRun[] = [];
        let currentIdx = 0;
        // Regex looks for **bold** or *italic*
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        let match;

        while ((match = regex.exec(contentText)) !== null) {
          // Push normal text before the bold/italic
          if (match.index > currentIdx) {
            runs.push(new docx.TextRun({ text: contentText.substring(currentIdx, match.index), size: 24, font: "Times New Roman" }));
          }

          const matchedText = match[0];
          if (matchedText.startsWith("**")) {
            // It is Bold
            runs.push(new docx.TextRun({ text: matchedText.slice(2, -2), bold: true, size: 24, font: "Times New Roman" }));
          } else if (matchedText.startsWith("*")) {
            // It is Italic
            runs.push(new docx.TextRun({ text: matchedText.slice(1, -1), italics: true, size: 24, font: "Times New Roman" }));
          }
          currentIdx = regex.lastIndex;
        }

        // Push any remaining normal text at the end of the line
        if (currentIdx < contentText.length) {
          runs.push(new docx.TextRun({ text: contentText.substring(currentIdx), size: 24, font: "Times New Roman" }));
        }

        // Configure the final paragraph
        const paraOptions: any = {
          children: runs,
          spacing: { after: 200, line: 360 }, // 1.5 Line Spacing standard
          alignment: docx.AlignmentType.JUSTIFIED,
        };

        if (bulletInfo) {
            paraOptions.bullet = bulletInfo;
            paraOptions.alignment = docx.AlignmentType.LEFT;
        }

        paragraphs.push(new docx.Paragraph(paraOptions));
      });

      return paragraphs;
    };

    if (isFullDocument) {
      // Add the overarching Master Title for the entire document
      docChildren.push(
        new docx.Paragraph({
          children: [new docx.TextRun({ text: data.topic?.toUpperCase() || "RESEARCH PROJECT", bold: true, size: 32, font: "Times New Roman" })],
          alignment: docx.AlignmentType.CENTER,
          spacing: { after: 800 },
        })
      );

      structure.forEach((chapter: any, index: number) => {
        if (chapter.key === "guidelines") return;

        const chapterText = contentData[chapter.key];
        
        if (chapterText) {
          // Add a Page Break before every chapter (except the very first one)
          if (index > 1) { 
            docChildren.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
          }

          // 🚨 FIX: We removed the injected chapter title here so the AI's title doesn't duplicate!
          const paragraphs = processTextToParagraphs(chapterText);
          docChildren.push(...paragraphs);
        }
      });

    } else {
      const singleChapterText = contentData[chapterKey];
      
      if (!singleChapterText) {
        return NextResponse.json({ error: "Chapter content not found" }, { status: 404 });
      }

      // 🚨 FIX: Removed duplicate title generation for single chapters too
      const paragraphs = processTextToParagraphs(singleChapterText);
      docChildren.push(...paragraphs);
    }

    const document = new docx.Document({
      creator: "Etumo Engine",
      title: data.topic || "Research Document",
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const buffer = await docx.Packer.toBuffer(document);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Etumo_Research_Document.docx"`,
      },
    });

  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
