import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // Assuming you have Firebase Admin set up for server-side operations
// If you don't use firebase-admin, you can use the standard client SDK here, but admin is safer for backend.

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber } = await req.json();

    if (!userId || !phoneNumber) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save the OTP to Firestore (Expires in 5 minutes)
    // We save it inside the user's document under a secure subcollection or field
    const expirationTime = Date.now() + 5 * 60 * 1000; 
    
    await db.collection("users").doc(userId).set({
      otpData: {
        code: otp,
        expiresAt: expirationTime,
        targetPhone: phoneNumber
      }
    }, { merge: true });

    // 3. Format the request for Africa's Talking API
    const username = process.env.AFRICASTALKING_USERNAME || "";
    const apiKey = process.env.AFRICASTALKING_API_KEY || "";

    const message = `Your Etomu Research Workspace access code is ${otp}. This code expires in 5 minutes.`;

    // 4. Send the SMS using the raw REST API
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": apiKey,
      },
      body: new URLSearchParams({
        username: username,
        to: phoneNumber, // Must be in +2567XXXXXXX format
        message: message,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, message: "OTP sent successfully." }, { status: 200 });
    } else {
      console.error("Africa's Talking Error:", data);
      return NextResponse.json({ error: "Failed to send SMS via network provider." }, { status: 500 });
    }

  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
