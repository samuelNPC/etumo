import { NextResponse } from "next/server";
import * as docx from "docx";
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    const processTextToElements = (rawString: string) => {
      // 🚨 AGGRESSIVE SANITIZER: Nuke HTML and normalize gaps
      let cleanContent = rawString
        .replace(/&nbsp;/gi, ' ') 
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<h[1-6][^>]*>/gi, '\n# ')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<(b|strong)[^>]*>/gi, '**')
        .replace(/<\/(b|strong)>/gi, '**')
        .replace(/<[^>]+>/g, ''); 

      // 🚨 MULTI-LINE TOC COLLAPSER: Fixes AI putting dots and numbers on new lines
      cleanContent = cleanContent.replace(/(.+)\n[\.\s]{3,}\n([0-9ivxlc]+)/gim, '$1 ..... $2');

      // 🚨 GAP LIMITER: Crush 3+ empty lines down to a maximum of 2
      const normalizedText = cleanContent.replace(/\n{3,}/g, '\n\n');
      const lines = normalizedText.split("\n");
      const elements: (docx.Paragraph | docx.Table)[] = [];

      let inTable = false;
      let tableRowsData: string[][] = [];
      let consecutiveEmptyLines = 0;

      const flushTable = () => {
        if (tableRowsData.length > 0) {
          // 🚨 BULLETPROOF TOC DETECTOR: If 40% of the second column are numbers, it's a TOC
          let numberCount = 0;
          tableRowsData.forEach(row => {
            if (row.length === 2 && /^[0-9ivxlc]+$/i.test(row[1].replace(/[^0-9a-zA-Z]/g, ''))) {
              numberCount++;
            }
          });
          const isTOC = tableRowsData[0].length === 2 && numberCount >= (tableRowsData.length * 0.4);

          if (isTOC) {
            tableRowsData.forEach(row => {
              const leftText = row[0].replace(/[*#]/g, '').trim();
              const rightText = row[1].replace(/[*#]/g, '').trim();
              
              if (!/^[0-9ivxlc]+$/i.test(rightText) && row === tableRowsData[0]) return; // Skip headers like "Title | Page"

              elements.push(new docx.Paragraph({
                children: [
                  ...parseInlineText(leftText),
                  new docx.TextRun({ text: "\t" + rightText, size: 24, font: "Times New Roman" })
                ],
                tabStops: [{ type: docx.TabStopPosition.RIGHT, position: 9000, leader: docx.LeaderType.DOT }],
                spacing: { after: 120 }
              }));
            });
          } else {
            // Standard Academic Grid Table
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

        // 1. Trigger Headers (Forces Page Breaks)
        const isChapterHeading = cleanLineToMatch.startsWith("CHAPTER ") && cleanLineToMatch.length < 60;
        const isTrigger = pageBreakTriggers.includes(cleanLineToMatch);

        if (isTrigger || isChapterHeading) {
          if (inTable) flushTable();
          consecutiveEmptyLines = 0;
          if (elements.length > 0) {
            elements.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
          }
          elements.push(
            new docx.Paragraph({
              text: trimmed.replace(/[*#|]/g, '').trim().toUpperCase(),
              heading: docx.HeadingLevel.HEADING_1,
              alignment: docx.AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          );
          continue;
        }

        // 2. Table Row Detector
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          inTable = true;
          consecutiveEmptyLines = 0;
          if (trimmed.match(/^\|[\s\-\|:]+\|$/)) continue; // ignore markdown separators
          const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
          tableRowsData.push(cells);
          continue;
        } else if (inTable) {
          flushTable();
        }

        // 3. Empty Line Gap Limiter
        if (trimmed === "") {
          consecutiveEmptyLines++;
          if (consecutiveEmptyLines <= 2) {
             elements.push(new docx.Paragraph({ text: "", spacing: { after: 120 } }));
          }
          continue;
        }
        consecutiveEmptyLines = 0;

        // 4. Stray TOC Line Interceptor (Catches literal dots or rogue pipes)
        const tocPlainMatch = trimmed.match(/^(.*?)(?:\.{3,}|\s\.\s\.\s\.)\s*([0-9ivxlc]+)$/i);
        const tocStrayMatch = trimmed.match(/^\|?\s*(.*?)\s*\|\s*([0-9ivxlc]+)\s*\|?$/i);
        
        let tocLeft = null;
        let tocRight = null;

        if (tocPlainMatch) {
            tocLeft = tocPlainMatch[1];
            tocRight = tocPlainMatch[2];
        } else if (tocStrayMatch && !trimmed.includes("---")) { 
            tocLeft = tocStrayMatch[1];
            tocRight = tocStrayMatch[2];
        }

        if (tocLeft && tocRight) {
             elements.push(new docx.Paragraph({
                children: [
                  ...parseInlineText(tocLeft.replace(/[*#|]/g, '').trim()),
                  new docx.TextRun({ text: "\t" + tocRight.trim(), size: 24, font: "Times New Roman" })
                ],
                tabStops: [{ type: docx.TabStopPosition.RIGHT, position: 9000, leader: docx.LeaderType.DOT }],
                spacing: { after: 120 }
            }));
            continue;
        }

        // 5. Generic Heading Parser (Fixes # tags showing as text)
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const contentText = headerMatch[2].replace(/\*/g, ""); 
          
          let headingLevel;
          let alignment = docx.AlignmentType.LEFT;
          
          if (level === 1) { headingLevel = docx.HeadingLevel.HEADING_1; alignment = docx.AlignmentType.CENTER; }
          else if (level === 2) { headingLevel = docx.HeadingLevel.HEADING_2; alignment = docx.AlignmentType.CENTER; }
          else if (level === 3) { headingLevel = docx.HeadingLevel.HEADING_3; }
          else { headingLevel = docx.HeadingLevel.HEADING_4; }

          elements.push(
            new docx.Paragraph({
              text: contentText,
              heading: headingLevel,
              alignment: alignment,
              spacing: { before: 200, after: 120 },
            })
          );
          continue;
        }

        // 6. Centered Brackets (e.g. [UNIVERSITY NAME])
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          elements.push(new docx.Paragraph({
            children: parseInlineText(trimmed, true), // force bold
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 200 }
          }));
          continue;
        }

        // 7. Conceptual Framework Placeholder
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

        // 8. Normal Paragraphs & Bullets
        const isBullet = /^[\*\-]\s+(.*)/.exec(trimmed);
        let contentText = trimmed;
        let bulletInfo = undefined;

        if (isBullet) {
           contentText = isBullet[1];
           bulletInfo = { level: 0 };
        }

        const paraOptions: any = {
          children: parseInlineText(contentText),
          spacing: { after: 120, line: 360 }, 
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

    const createHeader = () => {
      if (!isWatermarked) return undefined;
      return new docx.Header({
        children: [
          new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
              new docx.TextRun({ 
                text: "⚠️ ETUMO.COM FREE EVALUATION COPY ⚠️", 
                color: "D97706", 
                bold: true, 
                size: 22, 
                font: "Arial" 
              })
            ]
          })
        ]
      });
    };

    const createFooter = () => new docx.Footer({
      children: [
        new docx.Paragraph({
          alignment: docx.AlignmentType.CENTER,
          children: [
            ...(isWatermarked ? [
              new docx.TextRun({ 
                text: "ETUMO.COM FREE EVALUATION COPY - ", 
                color: "D97706", 
                bold: true, 
                size: 20, 
                font: "Arial" 
              })
            ] : []),
            new docx.TextRun({
              children: [docx.PageNumber.CURRENT],
              font: "Times New Roman",
              size: 24, 
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

    if (prelimChildren.length > 0) {
      docSections.push({
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: docx.NumberFormat.LOWER_ROMAN },
          },
          titlePage: true, 
        },
        headers: { default: createHeader() }, 
        footers: { default: createFooter() }, 
        children: prelimChildren,
      });
    }

    if (chapterChildren.length > 0) {
      docSections.push({
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: docx.NumberFormat.DECIMAL },
          },
        },
        headers: { default: createHeader() }, 
        footers: { default: createFooter() }, 
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
