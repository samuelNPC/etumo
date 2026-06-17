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

    // Elements can now be either Paragraphs OR Native Word Tables
    const docChildren: (docx.Paragraph | docx.Table)[] = [];

    // Helper: Parses inline formatting (like bold/italics) for both paragraphs and table cells
    const parseInlineText = (text: string, forceBold: boolean = false): docx.TextRun[] => {
      const runs: docx.TextRun[] = [];
      let currentIdx = 0;
      const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > currentIdx) {
          runs.push(new docx.TextRun({ text: text.substring(currentIdx, match.index), size: 24, font: "Times New Roman", bold: forceBold }));
        }

        const matchedText = match[0];
        if (matchedText.startsWith("**")) {
          runs.push(new docx.TextRun({ text: matchedText.slice(2, -2), bold: true, size: 24, font: "Times New Roman" }));
        } else if (matchedText.startsWith("*")) {
          runs.push(new docx.TextRun({ text: matchedText.slice(1, -1), italics: true, size: 24, font: "Times New Roman", bold: forceBold }));
        }
        currentIdx = regex.lastIndex;
      }

      if (currentIdx < text.length) {
        runs.push(new docx.TextRun({ text: text.substring(currentIdx), size: 24, font: "Times New Roman", bold: forceBold }));
      }
      return runs;
    };

    // 🚨 UPGRADED COMPILER ENGINE: Detects Tables, Diagrams, and Paragraphs
    const processTextToElements = (text: string) => {
      const lines = text.split("\n");
      const elements: (docx.Paragraph | docx.Table)[] = [];
      
      let inTable = false;
      let tableRowsData: string[][] = [];

      // Flushes the gathered table rows into a native Microsoft Word Table
      const flushTable = () => {
        if (tableRowsData.length > 0) {
          const table = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE }, // Full width table
            rows: tableRowsData.map((row, rowIndex) => {
              const isHeader = rowIndex === 0;
              return new docx.TableRow({
                children: row.map(cellText => {
                  return new docx.TableCell({
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    // Light gray shading for the header row to make it academic and professional
                    shading: isHeader ? { fill: "F3F4F6", type: docx.ShadingType.CLEAR, color: "auto" } : undefined,
                    children: [
                      new docx.Paragraph({
                        children: parseInlineText(cellText, isHeader),
                        alignment: isHeader ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
                        spacing: { after: 0, line: 240 },
                      })
                    ]
                  });
                })
              });
            })
          });
          
          elements.push(table);
          // Add a buffer paragraph after the table
          elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
        }
        inTable = false;
        tableRowsData = [];
      };

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        // 1. TABLE STATE DETECTOR
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          inTable = true;
          // Ignore the Markdown separator row (e.g. |---|---|)
          if (trimmed.match(/^\|[\s\-\|]+\|$/)) {
            continue;
          }
          // Split the columns and clean the text
          const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
          tableRowsData.push(cells);
          continue;
        } else if (inTable) {
          // If we hit a normal line but we were in a table, flush the table to the document
          flushTable();
        }

        // 2. EMPTY LINES
        if (trimmed === "") {
          elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
          continue;
        }

        // 3. CONCEPTUAL FRAMEWORK INTERCEPTOR (Highlights placeholder in bold Orange)
        if (trimmed.includes("[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]")) {
           elements.push(
            new docx.Paragraph({
              children: [
                new docx.TextRun({ 
                  text: "[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]", 
                  bold: true, 
                  color: "D97706", 
                  size: 24, 
                  font: "Times New Roman" 
                })
              ],
              alignment: docx.AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          );
          continue;
        }

        // 4. MARKDOWN HEADINGS (e.g. ### Chapter One)
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const contentText = headerMatch[2].replace(/\*/g, ""); 
          
          let headingLevel;
          switch(level) {
              case 1: headingLevel = docx.HeadingLevel.HEADING_1; break;
              case 2: headingLevel = docx.HeadingLevel.HEADING_2; break;
              case 3: headingLevel = docx.HeadingLevel.HEADING_3; break;
              default: headingLevel = docx.HeadingLevel.HEADING_4; break;
          }

          elements.push(
            new docx.Paragraph({
              text: contentText.toUpperCase(),
              heading: headingLevel,
              spacing: { before: 400, after: 200 },
            })
          );
          continue;
        }

        // 5. NORMAL PARAGRAPHS & BULLETS
        const isBullet = /^[\*\-]\s+(.*)/.exec(trimmed);
        let contentText = trimmed;
        let bulletInfo = undefined;

        if (isBullet) {
           contentText = isBullet[1];
           bulletInfo = { level: 0 };
        }

        const paraOptions: any = {
          children: parseInlineText(contentText),
          spacing: { after: 200, line: 360 }, // 1.5 Line Spacing standard
          alignment: docx.AlignmentType.JUSTIFIED,
        };

        if (bulletInfo) {
            paraOptions.bullet = bulletInfo;
            paraOptions.alignment = docx.AlignmentType.LEFT;
        }

        elements.push(new docx.Paragraph(paraOptions));
      }

      // Flush table if the document ended immediately after a table
      if (inTable) flushTable();

      return elements;
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

          const elements = processTextToElements(chapterText);
          docChildren.push(...elements);
        }
      });

    } else {
      const singleChapterText = contentData[chapterKey];
      
      if (!singleChapterText) {
        return NextResponse.json({ error: "Chapter content not found" }, { status: 404 });
      }

      const elements = processTextToElements(singleChapterText);
      docChildren.push(...elements);
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
