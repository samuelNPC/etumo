import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instrumentId, answers } = body;

    if (!instrumentId || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: "Incomplete submission data." }, { status: 400 });
    }

    // 🚨 1. FETCH INSTRUMENT TO CHECK DEADLINE
    const instrumentRef = doc(db, "instruments", instrumentId);
    const instrumentSnap = await getDoc(instrumentRef);

    if (!instrumentSnap.exists()) {
      return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
    }

    const instrumentData = instrumentSnap.data();

    // 🚨 2. SERVER-SIDE DEADLINE GUARD
    if (instrumentData.deadline && new Date() > new Date(instrumentData.deadline)) {
      return NextResponse.json({ error: "The deadline for this survey has passed." }, { status: 403 });
    }

    // 🚨 3. SAVE TO DATABASE
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
