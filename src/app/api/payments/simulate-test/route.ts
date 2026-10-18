import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { SimulatePaymentRequestSchema } from "@/lib/payments/types";
import { fulfillProSubscription } from "@/lib/payments/razorpay";
import { checkEntitlements } from "@/lib/payments/entitlements";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // empty body is acceptable
    }

    const parsed = SimulatePaymentRequestSchema.safeParse(body);
    const planId = parsed.success ? parsed.data.planId : "pro_monthly";
    const refId = `sim_free_test_${Date.now()}`;

    // Fulfill subscription and entitlements for free test
    const result = await fulfillProSubscription(
      user.id,
      planId,
      refId,
      `event_${refId}`
    );

    const entitlements = await checkEntitlements(user.id);

    return NextResponse.json(
      {
        success: true,
        idempotent: result.idempotent,
        message: "Free sandbox test payment processed! Pro access unlocked.",
        entitlements,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
