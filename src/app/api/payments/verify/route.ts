import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { VerifyPaymentRequestSchema } from "@/lib/payments/types";
import { verifyPaymentSignature, fulfillProSubscription } from "@/lib/payments/razorpay";
import { checkEntitlements } from "@/lib/payments/entitlements";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    const parsed = VerifyPaymentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = parsed.data;

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    // Fulfill subscription and entitlements
    const result = await fulfillProSubscription(
      user.id,
      planId,
      razorpay_payment_id,
      `pay_${razorpay_payment_id}`
    );

    const entitlements = await checkEntitlements(user.id);

    return NextResponse.json(
      {
        success: true,
        idempotent: result.idempotent,
        message: "Payment successfully verified! Pro features unlocked.",
        entitlements,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
