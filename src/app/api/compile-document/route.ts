import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

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
    const body = await req.json();
    const { projectId, chapterKey, isFullDocument } = body;

    if (!projectId || !chapterKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the project data from Firestore
    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = docSnap.data();
    const contentData = data.content || {};
    const structure = data.guidelines?.isCustomized ? (data.guidelines.structure || defaultStructure) : defaultStructure;

    const docChildren: Paragraph[] = [];

    const processTextToParagraphs = (text: string) => {
      const lines = text.split("\n");
      const paragraphs: Paragraph[] = [];

      lines.forEach((line) => {
        if (line.trim() === "") {
          paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        } else if (line.startsWith("#")) {
          const level = line.match(/^#+/)?.[0].length || 1;
          const cleanText = line.replace(/^#+\s/, "");
          paragraphs.push(
            new Paragraph({
              text: cleanText,
              heading: level === 1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
              spacing: { before: 400, after: 200 },
            })
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 24, font: "Times New Roman" })],
              spacing: { after: 200, line: 360 }, 
              alignment: AlignmentType.JUSTIFIED,
            })
          );
        }
      });

      return paragraphs;
    };

    if (isFullDocument) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: data.topic?.toUpperCase() || "RESEARCH PROJECT", bold: true, size: 32, font: "Times New Roman" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        })
      );

      structure.forEach((chapter: any, index: number) => {
        if (chapter.key === "guidelines") return;

        const chapterText = contentData[chapter.key];
        
        if (chapterText) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: chapter.label.toUpperCase(), bold: true, size: 28, font: "Times New Roman" })],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 400 },
              pageBreakBefore: index > 1, 
            })
          );

          const paragraphs = processTextToParagraphs(chapterText);
          docChildren.push(...paragraphs);
        }
      });

    } else {
      const singleChapterText = contentData[chapterKey];
      
      if (!singleChapterText) {
        return NextResponse.json({ error: "Chapter content not found" }, { status: 404 });
      }

      const chapterLabel = structure.find((c: any) => c.key === chapterKey)?.label || "Chapter";

      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: chapterLabel.toUpperCase(), bold: true, size: 28, font: "Times New Roman" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        })
      );

      const paragraphs = processTextToParagraphs(singleChapterText);
      docChildren.push(...paragraphs);
    }

    const doc = new Document({
      creator: "Etumo Engine",
      title: data.topic || "Research Document",
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const b64string = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64string, "base64");

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
