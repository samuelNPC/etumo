import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { projectId, chapterKey } = await req.json();

    // 1. Verify the project and fetch the content
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const projectData = projectSnap.data();
    const contentToExport = projectData.content[chapterKey];

    if (!contentToExport) {
      return NextResponse.json({ error: "No content to export." }, { status: 400 });
    }

    // SECURITY CHECK: In production, verify the payment status here
    // if (!projectData.paymentStatus[chapterKey]) return error;

    // 2. Build the Document using standard academic formatting
    const docx = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: projectData.topic,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Course: ${projectData.course} | Faculty: ${projectData.faculty}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),
            // Split the AI generated text by double line breaks to create Word paragraphs
            ...contentToExport.split("\n\n").map(
              (paragraphText: string) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: paragraphText,
                      font: "Times New Roman",
                      size: 24, // 12pt font (measured in half-points)
                    }),
                  ],
                  spacing: { line: 480 }, // Double spacing
                  alignment: AlignmentType.JUSTIFIED,
                })
            ),
          ],
        },
      ],
    });

    // 3. Package the document into a buffer
    const buffer = await Packer.toBuffer(docx);

    // 4. Send the buffer to the browser prompting a file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${chapterKey}_export.docx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate document." }, { status: 500 });
  }
}
