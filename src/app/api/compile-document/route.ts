import { NextResponse } from "next/server";
import * as docx from "docx";
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { projectId, chapterKey, isFullDocument, structure } = await req.json();

    const docChildren: (docx.Paragraph | docx.Table)[] = [];

    const parseInlineText = (text: string, forceBold: boolean = false): docx.TextRun[] => {
      const runs: docx.TextRun[] = [];
      let currentIdx = 0;
      const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > currentIdx) runs.push(new docx.TextRun({ text: text.substring(currentIdx, match.index), size: 24, font: "Times New Roman", bold: forceBold }));
        const matchedText = match[0];
        if (matchedText.startsWith("**")) runs.push(new docx.TextRun({ text: matchedText.slice(2, -2), bold: true, size: 24, font: "Times New Roman" }));
        else if (matchedText.startsWith("*")) runs.push(new docx.TextRun({ text: matchedText.slice(1, -1), italics: true, size: 24, font: "Times New Roman", bold: forceBold }));
        currentIdx = regex.lastIndex;
      }

      if (currentIdx < text.length) runs.push(new docx.TextRun({ text: text.substring(currentIdx), size: 24, font: "Times New Roman", bold: forceBold }));
      return runs;
    };

    const processBlocksToElements = (blocks: any[]) => {
      const elements: (docx.Paragraph | docx.Table)[] = [];

      blocks.forEach(block => {
        if (block.type === 'page-break') {
            elements.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
        } else if (block.type === 'h1') {
            elements.push(new docx.Paragraph({ text: block.text.toUpperCase(), heading: docx.HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
        } else if (block.type === 'h2') {
            elements.push(new docx.Paragraph({ text: block.text, heading: docx.HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
        } else if (block.type === 'h3') {
            elements.push(new docx.Paragraph({ text: block.text, heading: docx.HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
        } else if (block.type === 'p') {
            if (block.text.includes("[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]")) {
                elements.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "[INSERT CONCEPTUAL FRAMEWORK DIAGRAM HERE]", bold: true, color: "D97706", size: 24, font: "Times New Roman" })], alignment: docx.AlignmentType.CENTER, spacing: { before: 400, after: 400 }}));
            } else {
                elements.push(new docx.Paragraph({ children: parseInlineText(block.text), spacing: { after: 200, line: 360 }, alignment: docx.AlignmentType.JUSTIFIED }));
            }
        } else if (block.type === 'list-item') {
            elements.push(new docx.Paragraph({ children: parseInlineText(block.text), spacing: { after: 100, line: 360 }, alignment: docx.AlignmentType.LEFT, bullet: { level: 0 } }));
        } else if (block.type === 'table') {
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
                            children: [new docx.Paragraph({ children: parseInlineText(cellText, isHeader), alignment: isHeader ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT, spacing: { after: 0, line: 240 } })]
                        }))
                    });
                })
            }));
            elements.push(new docx.Paragraph({ text: "", spacing: { after: 200 } }));
        }
      });
      return elements;
    };

    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const data = docSnap.data();
    const contentData = data.content || {};

    if (isFullDocument) {
      docChildren.push(new docx.Paragraph({ children: [new docx.TextRun({ text: data.topic?.toUpperCase() || "RESEARCH PROJECT", bold: true, size: 32, font: "Times New Roman" })], alignment: docx.AlignmentType.CENTER, spacing: { after: 800 } }));

      structure.forEach((chapter: any, index: number) => {
        if (chapter.key === "guidelines") return;
        const chapterBlocks = contentData[chapter.key];
        if (chapterBlocks) {
          if (index > 1) docChildren.push(new docx.Paragraph({ text: "", pageBreakBefore: true }));
          docChildren.push(...processBlocksToElements(chapterBlocks));
        }
      });
    } else {
      const singleChapterBlocks = contentData[chapterKey];
      if (!singleChapterBlocks) return NextResponse.json({ error: "Chapter content not found" }, { status: 404 });
      docChildren.push(...processBlocksToElements(singleChapterBlocks));
    }

    const document = new docx.Document({ creator: "Etumo Engine", title: data.topic || "Research Document", sections: [{ properties: {}, children: docChildren }] });
    const buffer = await docx.Packer.toBuffer(document);

    return new NextResponse(buffer, { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="Etumo_Research_Document.docx"` } });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
