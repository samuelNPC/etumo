import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const signatureHeader = req.headers.get("x-webhook-signature");

    if (!signatureHeader) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
    }

    const webhookUrl = process.env.LIVEPAY_WEBHOOK_URL || "https://www.etomu.com/api/webhooks/livepay";
    const secret = process.env.LIVEPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("LIVEPAY_WEBHOOK_SECRET is not defined");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 1. Extract Timestamp and Signature from Header
    // Format: t=1705314900,v=5e884898da28047151d0e5...
    const [timestampPart, signaturePart] = signatureHeader.split(',');
    const timestamp = timestampPart.split('=')[1];
    const receivedSignature = signaturePart.split('=')[1];

    // 2. Reconstruct the string exactly as LivePay signed it
    const stringToSign = 
      webhookUrl + 
      timestamp + 
      payload.status + 
      payload.customer_reference + 
      payload.internal_reference;

    // 3. Generate our own signature to compare
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');

    // 4. Verify authenticity
    if (receivedSignature !== expectedSignature) {
      console.error("Invalid Webhook Signature detected!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // --- SIGNATURE VERIFIED! SAFE TO PROCESS ---

    if (payload.status === "Success") {
      // Log the successful transaction in Firebase so we have a permanent financial record
      await setDoc(doc(db, "transactions", payload.customer_reference), {
        amount: payload.amount,
        currency: payload.currency,
        provider: payload.provider,
        msisdn: payload.msisdn,
        internalReference: payload.internal_reference,
        completedAt: payload.completed_at,
        status: "Success",
        recordedAt: new Date().toISOString()
      });

      // You can also add logic here to unlock specific Firebase documents based on the customer_reference

    } else if (payload.status === "Failed") {
      console.log(`Payment failed for reference: ${payload.customer_reference} - ${payload.message}`);
    }

    // 5. LivePay requires a 200 OK within 10 seconds, or they will retry.
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    // Even if we fail internally, return a 500 so LivePay knows to retry later
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
