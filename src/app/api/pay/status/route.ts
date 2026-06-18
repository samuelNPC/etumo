import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required." }, { status: 400 });
    }

    const apiKey = process.env.LIVEPAY_API_KEY;
    const accountNumber = process.env.LIVEPAY_ACCOUNT_NUMBER;

    const response = await fetch(`https://livepay.me/api/transaction-status?accountNumber=${accountNumber}&currency=UGX&reference=${reference}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check status");
    }

    return NextResponse.json({ success: true, status: data.status }, { status: 200 });

  } catch (error: any) {
    console.error("Payment Status Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
