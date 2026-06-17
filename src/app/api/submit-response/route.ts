import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instrumentId, answers } = body;

    if (!instrumentId || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: "Incomplete submission data." }, { status: 400 });
    }

    // Save the response to the database, linked to the specific instrument
    const responseRef = await addDoc(collection(db, "responses"), {
      instrumentId,
      answers,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, responseId: responseRef.id }, { status: 200 });

  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json({ error: "Failed to submit your response." }, { status: 500 });
  }
}
