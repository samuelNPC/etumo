import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Utility to clean and standardize Ugandan phone numbers for Africa's Talking API rules
function formatUgandanPhoneNumber(phone: string): string {
  // Remove spaces, symbols, and non-numeric characters
  let cleanPhone = phone.replace(/[^\d]/g, '');

  if (cleanPhone.startsWith('0')) {
    // Standardizes 0784655792 -> 256784655792
    cleanPhone = '256' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('7')) {
    // Standardizes 784655792 -> 256784655792
    cleanPhone = '256' + cleanPhone;
  }

  // Africa's Talking strictly requires a leading '+' sign for international formatting (+256...)
  return '+' + cleanPhone;
}

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber } = await req.json();

    if (!userId || !phoneNumber) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Sanitize incoming phone text input immediately
    const formattedPhone = formatUgandanPhoneNumber(phoneNumber);

    // 2. SECURITY ENGINE BLOCK: Verify against database BEFORE running billing charges on the SMS API
    const phoneCheckSnapshot = await db.collection("users")
      .where("verifiedPhoneNumber", "==", formattedPhone)
      .get();

    if (!phoneCheckSnapshot.empty) {
      return NextResponse.json(
        { error: "This phone number has already been verified on another account to claim a free project." }, 
        { status: 403 }
      );
    }

    // 3. Generate a cryptographically structured 6-digit access code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save code reference to Firestore targeting user document with 5-minute TTL expiration
    const expirationTime = Date.now() + 5 * 60 * 1000; 
    
    await db.collection("users").doc(userId).set({
      otpData: {
        code: otp,
        expiresAt: expirationTime,
        targetPhone: formattedPhone
      }
    }, { merge: true });

    // 5. Build execution request body mapping for Africa's Talking Service
    const username = process.env.AFRICASTALKING_USERNAME || "";
    const apiKey = process.env.AFRICASTALKING_API_KEY || "";
    const message = `Your Etomu Research Workspace access code is ${otp}. This code expires in 5 minutes.`;

    // 6. Request direct carrier message delivery dispatch
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": apiKey,
      },
      body: new URLSearchParams({
        username: username,
        to: formattedPhone,
        message: message,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Verification message dispatched." }, { status: 200 });
    } else {
      console.error("Africa's Talking Transmission Failure Log:", data);
      return NextResponse.json({ error: "Carrier network dropped transmission processing request." }, { status: 500 });
    }

  } catch (error) {
    console.error("Critical Runtime Error inside Send-OTP Execution pipeline:", error);
    return NextResponse.json({ error: "Backend internal transaction process mapping failed." }, { status: 500 });
  }
}
