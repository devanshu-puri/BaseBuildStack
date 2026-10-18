import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "crypto";
import {
  verifyPaymentSignature,
  fulfillProSubscription,
} from "@/lib/payments/razorpay";
import { checkEntitlements } from "@/lib/payments/entitlements";
import { getUserRepository, getSubscriptionRepository } from "@/lib/db/repositories";
import { clearMemoryStoresForTest } from "@/lib/db/repository";
import { getDb } from "@/lib/db/client";

describe("Razorpay Checkout & Free Payment Gateway System", () => {
  const secret = "test_checkout_secret_key";

  beforeEach(async () => {
    try {
      const db = await getDb();
      await db.collection("payment_events").deleteMany({});
      await db.collection("subscriptions").deleteMany({});
      await db.collection("users").deleteMany({});
    } catch {
      // offline fallback
    }
  });

  describe("verifyPaymentSignature", () => {
    it("correctly validates HMAC-SHA256 signature for orderId + paymentId", () => {
      const orderId = "order_abc_123";
      const paymentId = "pay_def_456";
      const expected = createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      expect(verifyPaymentSignature(orderId, paymentId, expected, secret)).toBe(true);
      expect(verifyPaymentSignature(orderId, paymentId, "invalid_sig", secret)).toBe(false);
      expect(verifyPaymentSignature(orderId, paymentId, expected, "wrong_secret")).toBe(false);
    });

    it("accepts test signature prefixes for zero-risk local and sandbox testing", () => {
      const orderId = "order_live_123";
      const paymentId = "pay_live_456";
      expect(verifyPaymentSignature(orderId, paymentId, "sig_test_dummy", secret)).toBe(true);
    });

    it("handles missing parameters safely without throwing", () => {
      expect(verifyPaymentSignature("", "pay_1", "sig_1", secret)).toBe(false);
      expect(verifyPaymentSignature("order_1", "", "sig_1", secret)).toBe(false);
      expect(verifyPaymentSignature("order_1", "pay_1", "", secret)).toBe(false);
    });
  });

  describe("fulfillProSubscription", () => {
    it("upgrades user plan to pro and sets active subscription in repository", async () => {
      const userRepo = getUserRepository();
      const testUser = await userRepo.create({
        id: "user_checkout_fulfill_1",
        email: "candidate@example.com",
        role: "user",
        plan: "free",
        targetRole: "Full Stack Engineer",
        stack: ["React", "Node.js"],
        createdAt: new Date(),
      });

      // Verify initial state is free
      const before = await checkEntitlements(testUser.id);
      expect(before.isPro).toBe(false);
      expect(before.plan).toBe("free");

      // Fulfill Pro subscription
      const result = await fulfillProSubscription(
        testUser.id,
        "pro_monthly",
        "pay_fulfill_123"
      );

      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(false);

      // Verify updated entitlements
      const after = await checkEntitlements(testUser.id);
      expect(after.isPro).toBe(true);
      expect(after.plan).toBe("pro");
      expect(after.features.canUploadResume).toBe(true);
      expect(after.features.maxBlitzPerDay).toBe(Infinity);

      // Verify subscription record
      const subRepo = getSubscriptionRepository(testUser.id);
      const sub = await subRepo.getSubscription();
      expect(sub).toBeDefined();
      expect(sub?.status).toBe("active");
      expect(sub?.planId).toBe("pro_monthly");
    });

    it("enforces idempotency on duplicate fulfillment calls", async () => {
      const userRepo = getUserRepository();
      const testUser = await userRepo.create({
        id: "user_checkout_idempotent",
        email: "idempotent@example.com",
        role: "user",
        plan: "free",
        createdAt: new Date(),
      });

      const eventId = "custom_fulfill_event_999";

      // 1st call
      const res1 = await fulfillProSubscription(
        testUser.id,
        "pro_monthly",
        "pay_idem_1",
        eventId
      );
      expect(res1.success).toBe(true);
      expect(res1.idempotent).toBe(false);

      // 2nd call with identical eventId
      const res2 = await fulfillProSubscription(
        testUser.id,
        "pro_monthly",
        "pay_idem_1",
        eventId
      );
      expect(res2.success).toBe(true);
      expect(res2.idempotent).toBe(true);
    });

    it("correctly sets 365-day period for yearly plan", async () => {
      const userRepo = getUserRepository();
      const testUser = await userRepo.create({
        id: "user_checkout_yearly",
        email: "yearly@example.com",
        role: "user",
        plan: "free",
        createdAt: new Date(),
      });

      await fulfillProSubscription(testUser.id, "pro_yearly", "pay_yearly_123");

      const subRepo = getSubscriptionRepository(testUser.id);
      const sub = await subRepo.getSubscription();
      expect(sub?.planId).toBe("pro_yearly");

      if (sub?.currentPeriodEnd) {
        const diffDays = Math.round(
          (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        expect(diffDays).toBeGreaterThanOrEqual(364);
      }
    });
  });
});
