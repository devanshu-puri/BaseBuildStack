import { z } from "zod";

export const PlanIdSchema = z.enum(["pro_monthly", "pro_yearly"]);
export type PlanId = z.infer<typeof PlanIdSchema>;

export interface PlanConfig {
  id: PlanId;
  name: string;
  amountInPaise: number; // e.g. 99900 = ₹999
  currency: string;
  intervalDays: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  pro_monthly: {
    id: "pro_monthly",
    name: "BaseBuildStack Pro (Monthly)",
    amountInPaise: 900, // ₹9 in paise
    currency: "INR",
    intervalDays: 30,
  },
  pro_yearly: {
    id: "pro_yearly",
    name: "BaseBuildStack Pro (Yearly)",
    amountInPaise: 8900, // ₹89 in paise
    currency: "INR",
    intervalDays: 365,
  },
};

export const CreateOrderRequestSchema = z.object({
  planId: PlanIdSchema.default("pro_monthly"),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const VerifyPaymentRequestSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  planId: PlanIdSchema.default("pro_monthly"),
});
export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentRequestSchema>;

export const SimulatePaymentRequestSchema = z.object({
  orderId: z.string().optional(),
  planId: PlanIdSchema.default("pro_monthly"),
});
export type SimulatePaymentRequest = z.infer<typeof SimulatePaymentRequestSchema>;

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: PlanId;
  isTestMode?: boolean;
}

export const RazorpayWebhookEventSchema = z.object({
  entity: z.string().default("event"),
  account_id: z.string().optional(),
  event: z.string(), // e.g. "payment.captured", "order.paid"
  contains: z.array(z.string()).optional(),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string(),
          amount: z.number(),
          currency: z.string(),
          status: z.string(),
          order_id: z.string().optional(),
          notes: z
            .record(z.string(), z.string())
            .optional()
            .default({}),
        }),
      })
      .optional(),
    order: z
      .object({
        entity: z.object({
          id: z.string(),
          amount: z.number(),
          notes: z.record(z.string(), z.string()).optional(),
        }),
      })
      .optional(),
  }),
  created_at: z.number(),
});
export type RazorpayWebhookEvent = z.infer<typeof RazorpayWebhookEventSchema>;

export interface EntitlementStatus {
  plan: "free" | "pro";
  isPro: boolean;
  features: {
    maxBlitzPerDay: number;
    canUploadResume: boolean;
    canIndexRepo: boolean;
    canAccessAllLessons: boolean;
    canAccessRubricGrading: boolean;
  };
}
