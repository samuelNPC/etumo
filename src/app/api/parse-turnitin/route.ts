import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Convert the uploaded file into a Node.js Buffer so pdf-parse can read it
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract all raw text from the PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // --- REGEX EXTRACTION ENGINE ---

    // 1. Find Overall Similarity (e.g., "19% Overall Similarity")
    const similarityMatch = text.match(/([0-9]+)%\s*Overall Similarity/i);
    const overallSimilarity = similarityMatch ? parseInt(similarityMatch[1], 10) : 0;

    // 2. Find "Not Cited or Quoted" matches (e.g., "147 Not Cited or Quoted")
    const notCitedMatch = text.match(/([0-9]+)\s*Not Cited or Quoted/i);
    const notCited = notCitedMatch ? parseInt(notCitedMatch[1], 10) : 0;

    // 3. Find "Missing Quotations" (e.g., "23 Missing Quotations")
    const missingQuotesMatch = text.match(/([0-9]+)\s*Missing Quotations/i);
    const missingQuotations = missingQuotesMatch ? parseInt(missingQuotesMatch[1], 10) : 0;

    // 4. Extract Student Name (Heuristic: Grabs the line right before "Document Details")
    const nameMatch = text.match(/\n([A-Za-z\s]+)\nDocument Details/i);
    // Clean up the name by grabbing the last line before "Document Details" if it duplicated
    const rawNameString = nameMatch ? nameMatch[1].trim() : "Student";
    const nameArray = rawNameString.split('\n');
    const studentName = nameArray[nameArray.length - 1].trim(); // Gets "Ampeire Samuel"

    // 5. Extract Top Sources (Grabs the block after the Top Sources intro text)
    let topSources: string[] = [];
    const sourcesBlockMatch = text.match(/The sources with the highest number of matches within the submission.*?\n([\s\S]*?)(?:Page \d+ of|Integrity Flags|11\s)/i);
    
    if (sourcesBlockMatch) {
      const sourcesText = sourcesBlockMatch[1];
      // Extract lines that look like sources (e.g., "Kabale University 1%", "scholar.ucu.ac.ug 1%")
      // We look for lines ending with a percentage
      const sourceLines = sourcesText.match(/.*?[0-9]+%/g);
      if (sourceLines) {
         topSources = sourceLines.map(line => {
             // Clean up prefixes like "1 Student papers\n" or "2 Internet\n"
             const cleanLine = line.replace(/^[0-9]+\s+(Student papers|Internet|Publications)\s*/i, "").trim();
             return cleanLine;
         }).slice(0, 5); // Just grab the top 5 to keep the UI clean
      }
    }

    // Return the perfectly structured JSON object to your frontend
    return NextResponse.json({
      success: true,
      data: {
        studentName,
        overallSimilarity,
        issues: {
          notCited,
          missingQuotations
        },
        topSources
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error parsing Turnitin PDF:", error);
    return NextResponse.json({ error: "Failed to parse the document. Ensure it is a valid Turnitin PDF." }, { status: 500 });
  }
}
