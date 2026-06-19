import { NextResponse } from "next/server";
import * as docx from "docx";
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, chapterKey, isFullDocument, structure, rawText, rawTitle } = body;

    const docChildren: (docx.Paragraph | docx.Table)[] = [];

    // Helper: Parses inline bolding and italics for Word elements
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

    // 🚨 NEW AST ENGINE: Compiles JSON block arrays perfectly into Word format
    const processBlocksToElements = (blocks: any[]) => {
      const elements: (docx.Paragraph | docx.Table)[] = [];

      blocks.forEach(block => {
        if (block.type === 'page-break') {
            elements.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
        } 
        else if (block.type === 'h1') {
            elements.push(new docx.Paragraph({ 
                text: block.text.toUpperCase(), 
                heading: docx.HeadingLevel.HEADING_1, 
                spacing: { before: 400, after: 200 } 
            }));
        } 
        else if (block.type === 'h2') {
            elements.push(new docx.Paragraph({ 
                text: block.text, 
                heading: docx.HeadingLevel.HEADING_2, 
                spacing: { before: 300, after: 100 } 
            }));
        } 
        else if (block.type === 'h3') {
            elements.push(new docx.Paragraph({ 
                text: block.text, 
                heading: docx.HeadingLevel.HEADING_3, 
                spacing: { before: 200, after: 100 } 
            }));
        } 
        else if (block.type === 'p') {
            if (block.text.includes("[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]")) {
                elements.push(new docx.Paragraph({ 
                    children: [new docx.TextRun({ text: "[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]", bold: true, color: "D97706", size: 24, font: "Times New Roman" })], 
                    alignment: docx.AlignmentType.CENTER, 
                    spacing: { before: 400, after: 400 }
                }));
            } else {
                elements.push(new docx.Paragraph({ 
                    children: parseInlineText(block.text), 
                    spacing: { after: 200, line: 360 }, 
                    alignment: docx.AlignmentType.JUSTIFIED 
                }));
            }
        } 
        else if (block.type === 'list-item') {
            elements.push(new docx.Paragraph({ 
                children: parseInlineText(block.text), 
                spacing: { after: 100, line: 360 }, 
                alignment: docx.AlignmentType.LEFT, 
                bullet: { level: 0 } 
            }));
        } 
        else if (block.type === 'table') {
            const rows = block.text.split('\n').filter((r: string) => !/^[|\-\s:]+$/.test(r.trim()) && r.includes('-'));
            const tableRowsData = rows.map((r: string) => {
                let cells = r.split('|').map(c => c.trim());
                if (cells.length > 0 && cells[0] === '') cells.shift();
                if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
                return cells;
            });

            elements.push(new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                rows: tableRowsData.map((row: string[], rowIndex: number) => {
                    const isHeader = rowIndex === 0;
                    return new docx.TableRow({
                        children: row.map(cellText => new docx.TableCell({
                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                            shading: isHeader ? { fill: "F3F4F6", type: docx.ShadingType.CLEAR, color: "auto" } : undefined,
                            children: [new docx.Paragraph({ 
                                children: parseInlineText(cellText, isHeader), 
                                alignment: isHeader ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT, 
                                spacing: { after: 0, line: 240 } 
                            })]
                        }))
                    });
                })
            }));
            elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
        }
      });
      return elements;
    };

    // 🚨 ORIGINALITY CENTER BYPASS (Maintains the old string parser strictly for this tool)
    if (rawText) {
      const processTextToElements = (text: string) => {
        const lines = text.split("\n");
        const elements: (docx.Paragraph | docx.Table)[] = [];
        let inTable = false;
        let tableRowsData: string[][] = [];

        const flushTable = () => {
          if (tableRowsData.length > 0) {
            elements.push(new docx.Table({
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
              rows: tableRowsData.map((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                return new docx.TableRow({
                  children: row.map(cellText => new docx.TableCell({
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    shading: isHeader ? { fill: "F3F4F6", type: docx.ShadingType.CLEAR, color: "auto" } : undefined,
                    children: [new docx.Paragraph({ children: parseInlineText(cellText, isHeader), alignment: isHeader ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT, spacing: { after: 0, line: 240 } })]
                  }))
                });
              })
            }));
            elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
          }
          inTable = false;
          tableRowsData = [];
        };

        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            inTable = true;
            if (trimmed.match(/^\|[\s\-\|]+\|$/)) continue;
            tableRowsData.push(trimmed.split("|").slice(1, -1).map(c => c.trim()));
            continue;
          } else if (inTable) flushTable();

          if (trimmed === "") {
            elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
            continue;
          }

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
            elements.push(new docx.Paragraph({ text: contentText.toUpperCase(), heading: headingLevel, spacing: { before: 400, after: 200 } }));
            continue;
          }

          const isBullet = /^[\*\-]\s+(.*)/.exec(trimmed);
          let contentText = isBullet ? isBullet[1] : trimmed;
          const paraOptions: any = { children: parseInlineText(contentText), spacing: { after: 200, line: 360 }, alignment: docx.AlignmentType.JUSTIFIED };
          
          if (isBullet) {
              paraOptions.bullet = { level: 0 };
              paraOptions.alignment = docx.AlignmentType.LEFT;
          }
          elements.push(new docx.Paragraph(paraOptions));
        }
        if (inTable) flushTable();
        return elements;
      };

      if (rawTitle) {
        docChildren.push(
          new docx.Paragraph({ children: [new docx.TextRun({ text: rawTitle.toUpperCase(), bold: true, size: 32, font: "Times New Roman" })], alignment: docx.AlignmentType.CENTER, spacing: { after: 800 } })
        );
      }
      docChildren.push(...processTextToElements(rawText));

      const document = new docx.Document({ creator: "Etumo Engine", title: rawTitle || "Remediated Document", sections: [{ properties: {}, children: docChildren }] });
      const buffer = await docx.Packer.toBuffer(document);
      return new NextResponse(buffer, { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="Remediated_Document.docx"` } });
    }

    // --- MAIN WORKSPACE LOGIC (Uses AST Arrays) ---
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

    if (isFullDocument) {
      docChildren.push(
        new docx.Paragraph({
          children: [new docx.TextRun({ text: data.topic?.toUpperCase() || "RESEARCH PROJECT", bold: true, size: 32, font: "Times New Roman" })],
          alignment: docx.AlignmentType.CENTER,
          spacing: { after: 800 },
        })
      );

      structure.forEach((chapter: any, index: number) => {
        if (chapter.key === "guidelines") return;
        const chapterBlocks = contentData[chapter.key];

        if (chapterBlocks) {
          if (index > 1) { 
            docChildren.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
          }
          docChildren.push(...processBlocksToElements(chapterBlocks));
        }
      });

    } else {
      const singleChapterBlocks = contentData[chapterKey];
      if (!singleChapterBlocks) {
        return NextResponse.json({ error: "Chapter content not found" }, { status: 404 });
      }
      docChildren.push(...processBlocksToElements(singleChapterBlocks));
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
