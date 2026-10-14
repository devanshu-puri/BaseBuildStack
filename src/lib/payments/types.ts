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
    amountInPaise: 99900,
    currency: "INR",
    intervalDays: 30,
  },
  pro_yearly: {
    id: "pro_yearly",
    name: "BaseBuildStack Pro (Yearly)",
    amountInPaise: 999900,
    currency: "INR",
    intervalDays: 365,
  },
};

export const CreateOrderRequestSchema = z.object({
  planId: PlanIdSchema.default("pro_monthly"),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: PlanId;
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
