import { NextRequest, NextResponse } from "next/server";
import { processRazorpayWebhook } from "@/lib/payments/razorpay";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const result = await processRazorpayWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        received: true,
        idempotent: result.idempotent,
        event: result.event,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
