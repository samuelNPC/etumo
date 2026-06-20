import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Utility to clean and standardize Ugandan phone numbers for Africa's Talking
function formatUgandanPhoneNumber(phone: string): string {
  // Remove all spaces, dashes, or non-digit characters except the plus sign
  let cleanPhone = phone.replace(/[^\d+]/g, '');

  if (cleanPhone.startsWith('0')) {
    // Converts 0784655792 to +256784655792
    cleanPhone = '+256' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('256')) {
    // Converts 256784655792 to +256784655792
    cleanPhone = '+' + cleanPhone;
  } else if (cleanPhone.startsWith('7')) {
    // Converts 784655792 to +256784655792
    cleanPhone = '+256' + cleanPhone;
  } else if (!cleanPhone.startsWith('+')) {
    // Fallback safety net
    cleanPhone = '+' + cleanPhone;
  }

  return cleanPhone;
}

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber } = await req.json();

    if (!userId || !phoneNumber) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Sanitize the incoming phone number
    const formattedPhone = formatUgandanPhoneNumber(phoneNumber);

    // 2. SECURITY ENGINE: Check the database BEFORE spending SMS API credits
    const phoneCheckSnapshot = await db.collection("users")
      .where("verifiedPhoneNumber", "==", formattedPhone)
      .get();

    if (!phoneCheckSnapshot.empty) {
       return NextResponse.json(
         { error: "This phone number has already claimed a free project on another account." }, 
         { status: 403 }
       );
    }

    // 3. Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save the OTP to Firestore (Expires in 5 minutes)
    const expirationTime = Date.now() + 5 * 60 * 1000; 
    
    await db.collection("users").doc(userId).set({
      otpData: {
        code: otp,
        expiresAt: expirationTime,
        targetPhone: formattedPhone // Save the cleaned number
      }
    }, { merge: true });

    // 5. Format the request for Africa's Talking API
    const username = process.env.AFRICASTALKING_USERNAME || "";
    const apiKey = process.env.AFRICASTALKING_API_KEY || "";

    const message = `Your Etomu Research Workspace access code is ${otp}. This code expires in 5 minutes.`;

    // 6. Send the SMS using the raw REST API
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": apiKey,
      },
      body: new URLSearchParams({
        username: username,
        to: formattedPhone, // Uses the cleaned +256 format
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
