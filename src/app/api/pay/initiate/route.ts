import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phoneNumber, amount, description } = await req.json();

    if (!phoneNumber || !amount) {
      return NextResponse.json({ error: "Phone number and amount are required." }, { status: 400 });
    }

    const apiKey = process.env.LIVEPAY_API_KEY;
    const accountNumber = process.env.LIVEPAY_ACCOUNT_NUMBER;

    if (!apiKey || !accountNumber) {
      return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 500 });
    }

    // LivePay requires reference to be max 30 chars, no spaces.
    const reference = `ETM${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const response = await fetch("https://livepay.me/api/collect-money", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        accountNumber,
        phoneNumber,
        amount,
        currency: "UGX",
        reference,
        description: description || "Etomu Academic Service"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to initiate payment with LivePay");
    }

    return NextResponse.json({ success: true, reference: data.reference }, { status: 200 });

  } catch (error: any) {
    console.error("Payment Initiation Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
