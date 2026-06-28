import { NextRequest, NextResponse } from "next/server";
import AfricasTalking from "africastalking";

const username = process.env.AFRICASTALKING_USERNAME;
const apiKey = process.env.AFRICASTALKING_API_KEY;

if (!username || !apiKey) {
  throw new Error(
    "Missing AFRICASTALKING_USERNAME or AFRICASTALKING_API_KEY environment variables."
  );
}

const africastalking = AfricasTalking({
  username,
  apiKey,
});

const airtime = africastalking.AIRTIME;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid amount.",
        },
        { status: 400 }
      );
    }

    const response = await airtime.send({
      recipients: [
  {
    phoneNumber: "+256759997376",
    currencyCode: "UGX",
    amount: `UGX ${amount}`,
  },
],
    });

    return NextResponse.json({
      success: true,
      message: "Airtime sent successfully.",
      data: response,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send airtime.",
      },
      { status: 500 }
    );
  }
}