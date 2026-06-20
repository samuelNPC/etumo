import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const userData = userDoc.data();
    const otpData = userData?.otpData;

    // 1. Verify OTP exists and matches
    if (!otpData || otpData.code !== code) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    // 2. Check if the code is expired
    if (Date.now() > otpData.expiresAt) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // 3. SECURITY ENGINE: Check if this phone number has already been used by another account
    // This stops users from using the same MTN number across 10 fake Gmail accounts!
    const phoneCheckSnapshot = await db.collection("users")
      .where("verifiedPhoneNumber", "==", otpData.targetPhone)
      .get();

    if (!phoneCheckSnapshot.empty) {
       return NextResponse.json({ error: "This phone number has already claimed a free project." }, { status: 403 });
    }

    // 4. Success! Grant the free project entitlement and wipe the temporary OTP data
    await userRef.update({
      phoneVerified: true,
      verifiedPhoneNumber: otpData.targetPhone,
      freeProjectClaimed: true,
      otpData: null // Clean up the database
    });

    return NextResponse.json({ success: true, message: "Workspace unlocked!" }, { status: 200 });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
