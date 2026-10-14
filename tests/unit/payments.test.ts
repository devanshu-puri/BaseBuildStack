import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "crypto";
import {
  verifyWebhookSignature,
  createRazorpayOrder,
  processRazorpayWebhook,
} from "@/lib/payments/razorpay";
import { checkEntitlements } from "@/lib/payments/entitlements";
import { getUserRepository } from "@/lib/db/repositories";
import { clearMemoryStoresForTest } from "@/lib/db/repository";
import { getDb } from "@/lib/db/client";

describe("Razorpay Payments & Entitlements", () => {
  const secret = "test_webhook_secret_key";

  beforeEach(async () => {
    clearMemoryStoresForTest();
    try {
      const db = await getDb();
      await db.collection("payment_events").deleteMany({});
      await db.collection("subscriptions").deleteMany({});
      await db.collection("users").deleteMany({});
    } catch {
      // offline fallback
    }
  });

  it("verifies HMAC-SHA256 signatures accurately", () => {
    const payload = JSON.stringify({ event: "payment.captured", id: "pay_123" });
    const validSignature = createHmac("sha256", secret).update(payload).digest("hex");

    expect(verifyWebhookSignature(payload, validSignature, secret)).toBe(true);
    expect(verifyWebhookSignature(payload, "invalid_sig_abc123", secret)).toBe(false);
    expect(verifyWebhookSignature(payload, validSignature, "wrong_secret")).toBe(false);
    expect(verifyWebhookSignature("", validSignature, secret)).toBe(false);
  });

  it("creates valid subscription order with amount in paise", async () => {
    const order = await createRazorpayOrder("user_pay_test", "pro_monthly");

    expect(order.orderId).toMatch(/^order_/);
    expect(order.amount).toBe(99900); // ₹999 in paise
    expect(order.currency).toBe("INR");
    expect(order.planId).toBe("pro_monthly");
  });

  it("processes payment.captured webhooks idempotently", async () => {
    const userRepo = getUserRepository();
    const testUser = await userRepo.create({
      id: "user_entitlement_test",
      email: "buyer@example.com",
      role: "user",
      plan: "free",
      targetRole: "Full Stack Engineer",
      stack: ["React", "Node.js"],
      createdAt: new Date(),
    });

    // Initial state: Free
    const initialEntitlements = await checkEntitlements(testUser.id);
    expect(initialEntitlements.isPro).toBe(false);
    expect(initialEntitlements.features.canUploadResume).toBe(false);

    // Prepare simulated Razorpay webhook payload
    const eventPayload = {
      entity: "event",
      event: "payment.captured",
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: "pay_xyz_987",
            amount: 99900,
            currency: "INR",
            status: "captured",
            order_id: "order_xyz_987",
            notes: {
              userId: testUser.id,
              planId: "pro_monthly",
            },
          },
        },
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

    // 1st Webhook delivery -> Processed & Entitlement upgraded
    const res1 = await processRazorpayWebhook(rawBody, signature, secret);
    expect(res1.success).toBe(true);
    expect(res1.idempotent).toBe(false);

    // Verify user entitlement upgraded to Pro
    const upgradedEntitlements = await checkEntitlements(testUser.id);
    expect(upgradedEntitlements.isPro).toBe(true);
    expect(upgradedEntitlements.plan).toBe("pro");
    expect(upgradedEntitlements.features.canUploadResume).toBe(true);
    expect(upgradedEntitlements.features.maxBlitzPerDay).toBe(Infinity);

    // 2nd Webhook delivery with same payload -> Must be flagged as IDEMPOTENT
    const res2 = await processRazorpayWebhook(rawBody, signature, secret);
    expect(res2.success).toBe(true);
    expect(res2.idempotent).toBe(true); // Idempotency verified!
  });

  it("rejects webhooks with invalid signatures", async () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    const fakeSignature = "deadbeef12345678";

    const res = await processRazorpayWebhook(rawBody, fakeSignature, secret);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Invalid webhook signature");
  });
});
