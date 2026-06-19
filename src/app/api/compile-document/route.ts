import { NextResponse } from "next/server";
import * as docx from "docx";
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 🚨 ADDED: isWatermarked flag extracted from the request
    const { projectId, chapterKey, isFullDocument, structure, rawText, rawTitle, isWatermarked } = body;

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

    const pageBreakTriggers = [
      "DECLARATION", "APPROVAL", "DEDICATION", "ACKNOWLEDGEMENT", "ACKNOWLEDGEMENTS",
      "ABSTRACT", "TABLE OF CONTENTS", "LIST OF TABLES", "LIST OF FIGURES", 
      "LIST OF ACRONYMS", "LIST OF ABBREVIATIONS"
    ];

    const processTextToElements = (text: string) => {
      const normalizedText = text.replace(/\n{3,}/g, '\n\n');
      const lines = normalizedText.split("\n");
      const elements: (docx.Paragraph | docx.Table)[] = [];

      let inTable = false;
      let tableRowsData: string[][] = [];

      const flushTable = () => {
        if (tableRowsData.length > 0) {
          const isTOC = tableRowsData.every((row, idx) => {
            if (idx === 0) return true; 
            if (row.length !== 2) return false;
            const lastCol = row[1];
            return /^[0-9ivxlc]+$/i.test(lastCol.replace(/[^0-9a-zA-Z]/g, '')) && lastCol.length <= 6;
          });

          if (isTOC) {
            tableRowsData.forEach(row => {
              elements.push(new docx.Paragraph({
                children: [
                  ...parseInlineText(row[0].replace(/\*\*/g, '')),
                  new docx.TextRun({ text: "\t" + row[1], size: 24, font: "Times New Roman" })
                ],
                tabStops: [{ type: docx.TabStopType.RIGHT, position: 9000, leader: docx.TabStopLeader.DOT }],
                spacing: { after: 120 }
              }));
            });
          } else {
            const table = new docx.Table({
              width: { size: 100, type: docx.WidthType.PERCENTAGE }, 
              rows: tableRowsData.map((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                return new docx.TableRow({
                  children: row.map(cellText => {
                    return new docx.TableCell({
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
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
          }
          elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
        }
        inTable = false;
        tableRowsData = [];
      };

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const cleanLineToMatch = trimmed.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();

        if (cleanLineToMatch === "PRELIMINARY PAGES" || cleanLineToMatch === "APPENDICES") continue;

        const isChapterHeading = cleanLineToMatch.startsWith("CHAPTER ") && cleanLineToMatch.length < 60;
        const isTrigger = pageBreakTriggers.includes(cleanLineToMatch);

        if (isTrigger || isChapterHeading) {
          if (inTable) flushTable();
          if (elements.length > 0) {
            elements.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
          }
          elements.push(
            new docx.Paragraph({
              text: trimmed.replace(/[*#]/g, '').trim().toUpperCase(),
              heading: docx.HeadingLevel.HEADING_1,
              alignment: docx.AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          );
          continue;
        }

        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          inTable = true;
          if (trimmed.match(/^\|[\s\-\|:]+\|$/)) continue;
          const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
          tableRowsData.push(cells);
          continue;
        } else if (inTable) {
          flushTable();
        }

        if (trimmed === "") {
          elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
          continue;
        }

        if (trimmed.includes("[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]")) {
           elements.push(
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: "[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]", bold: true, color: "D97706", size: 24, font: "Times New Roman" })
              ],
              alignment: docx.AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          );
          continue;
        }

        const headerMatch = trimmed.match(/^(#{2,6})\s+(.*)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const contentText = headerMatch[2].replace(/\*/g, ""); 
          let headingLevel = level === 2 ? docx.HeadingLevel.HEADING_2 : docx.HeadingLevel.HEADING_3;

          elements.push(
            new docx.Paragraph({
              text: contentText,
              heading: headingLevel,
              alignment: level === 2 ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
              spacing: { before: 400, after: 200 },
            })
          );
          continue;
        }

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          elements.push(new docx.Paragraph({
            children: parseInlineText(trimmed),
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 200 }
          }));
          continue;
        }

        const isBullet = /^[\*\-]\s+(.*)/.exec(trimmed);
        let contentText = trimmed;
        let bulletInfo = undefined;

        if (isBullet) {
           contentText = isBullet[1];
           bulletInfo = { level: 0 };
        }

        const paraOptions: any = {
          children: parseInlineText(contentText),
          spacing: { after: 200, line: 360 }, 
          alignment: docx.AlignmentType.JUSTIFIED,
        };

        if (bulletInfo) {
            paraOptions.bullet = bulletInfo;
            paraOptions.alignment = docx.AlignmentType.LEFT;
        }

        elements.push(new docx.Paragraph(paraOptions));
      }

      if (inTable) flushTable();
      return elements;
    };

    // 🚨 YELLOW ETUMO WATERMARK HEADER FOR FREE TIER
    const createHeader = () => {
      if (!isWatermarked) return undefined;
      return new docx.Header({
        children: [
          new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
              new docx.TextRun({ 
                text: "⚠️ ETUMO.COM FREE EVALUATION COPY ⚠️", 
                color: "D97706", // Etumo Yellow/Orange
                bold: true, 
                size: 22, 
                font: "Arial" 
              })
            ]
          })
        ]
      });
    };

    // 🚨 YELLOW ETUMO DISCLAIMER FOOTER
    const createFooter = () => new docx.Footer({
      children: [
        new docx.Paragraph({
          alignment: docx.AlignmentType.CENTER,
          children: [
            ...(isWatermarked ? [
              new docx.TextRun({ 
                text: "ETUMO.COM FREE EVALUATION COPY - ", 
                color: "D97706", // Etumo Yellow/Orange
                bold: true, 
                size: 20, 
                font: "Arial" 
              })
            ] : []),
            new docx.TextRun({
              children: [docx.PageNumber.CURRENT],
              font: "Times New Roman",
              size: 24, // 12pt standard academic size
            })
          ]
        })
      ]
    });

    const prelimChildren: (docx.Paragraph | docx.Table)[] = [];
    const chapterChildren: (docx.Paragraph | docx.Table)[] = [];
    const docSections: docx.ISectionOptions[] = [];

    if (rawText) {
      if (rawTitle) {
        prelimChildren.push(
          new docx.Paragraph({
            children: [new docx.TextRun({ text: rawTitle.toUpperCase(), bold: true, size: 32, font: "Times New Roman" })],
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 800 },
          })
        );
      }
      
      const chapMatch = rawText.match(/^(#{1,3}\s*)?CHAPTER\s+/mi);
      if (chapMatch && chapMatch.index !== undefined && chapMatch.index > 0) {
        const pText = rawText.substring(0, chapMatch.index);
        const cText = rawText.substring(chapMatch.index);
        prelimChildren.push(...processTextToElements(pText));
        chapterChildren.push(...processTextToElements(cText));
      } else {
        chapterChildren.push(...processTextToElements(rawText));
      }
    } 
    else {
      if (!projectId || !chapterKey || !structure) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const contentData = docSnap.data().content || {};

      if (isFullDocument) {
        structure.forEach((chapter: any) => {
          if (chapter.key === "guidelines") return;
          const chapterText = contentData[chapter.key];
          
          if (chapterText) {
            const elements = processTextToElements(chapterText);
            if (chapter.key === "preliminaryPages") {
              prelimChildren.push(...elements);
            } else {
              if (chapterChildren.length > 0) {
                chapterChildren.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
              }
              chapterChildren.push(...elements);
            }
          }
        });
      } else {
        const singleChapterText = contentData[chapterKey];
        if (!singleChapterText) return NextResponse.json({ error: "Chapter content not found" }, { status: 404 });
        
        if (chapterKey === "preliminaryPages") {
          prelimChildren.push(...processTextToElements(singleChapterText));
        } else {
          chapterChildren.push(...processTextToElements(singleChapterText));
        }
      }
    }

    // 🚨 SECTION 1: PRELIMINARY PAGES
    if (prelimChildren.length > 0) {
      docSections.push({
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: docx.PageNumberFormat.LOWER_ROMAN },
          },
          titlePage: true, 
        },
        headers: { default: createHeader() }, // Attaches the top watermark
        footers: { default: createFooter() }, // Attaches the bottom disclaimer
        children: prelimChildren,
      });
    }

    // 🚨 SECTION 2: MAIN CHAPTERS
    if (chapterChildren.length > 0) {
      docSections.push({
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: docx.PageNumberFormat.DECIMAL },
          },
        },
        headers: { default: createHeader() }, // Attaches the top watermark
        footers: { default: createFooter() }, // Attaches the bottom disclaimer
        children: chapterChildren,
      });
    }

    const document = new docx.Document({
      creator: "Etumo Engine",
      title: rawTitle || "Research Document",
      sections: docSections,
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
