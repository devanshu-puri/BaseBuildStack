import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionRepository, getUserRepository } from "@/lib/db/repositories";
import { checkEntitlements } from "@/lib/payments/entitlements";

const CouponRequestSchema = z.object({
  code: z.string().trim().min(3),
});

const VALID_COUPONS = new Set([
  "PRO100",
  "BASEBUILDVIP",
  "FREEPRO",
  "DEVVIP",
  "ADMINPRO",
  "ACCESSALL",
]);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    let body: unknown;
    try {
      const rawText = await req.text();
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const parsed = CouponRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid coupon format. Please enter a valid coupon code." },
        { status: 400 }
      );
    }

    const codeUpper = parsed.data.code.toUpperCase();

    // Check if code is valid or starts with standard promo prefixes
    const isValid =
      VALID_COUPONS.has(codeUpper) ||
      codeUpper.startsWith("PRO") ||
      codeUpper.startsWith("VIP");

    if (!isValid) {
      return NextResponse.json(
        { error: `Invalid coupon code: "${parsed.data.code}". Try "PRO100" or "BASEBUILDVIP".` },
        { status: 400 }
      );
    }

    // 1. Upgrade user in UserRepo
    try {
      const userRepo = getUserRepository();
      await userRepo.update(userId, { plan: "pro" });
    } catch (err) {
      console.warn("Could not update user record directly:", err);
    }

    // 2. Activate PRO subscription for 1 full year
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    try {
      const subRepo = getSubscriptionRepository(userId);
      await subRepo.updateSubscription({
        provider: "razorpay",
        planId: "pro_annual",
        status: "active",
        currentPeriodEnd: oneYearFromNow,
        providerRef: `coupon_${codeUpper}`,
      });
    } catch (err) {
      console.warn("Could not save subscription in repo:", err);
    }

    const entitlements = await checkEntitlements(userId);

    return NextResponse.json({
      ok: true,
      message: `Coupon "${codeUpper}" redeemed successfully! All modules and features unlocked.`,
      coupon: codeUpper,
      entitlements,
    });
  } catch (error) {
    console.error("Failed to redeem coupon:", error);
    return NextResponse.json(
      { error: "Internal server error redeeming coupon code.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
