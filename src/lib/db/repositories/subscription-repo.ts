import { UserScopedRepository } from "../repository";
import { SubscriptionSchema, SubscriptionDocument } from "../schemas";

export class SubscriptionRepository extends UserScopedRepository<SubscriptionDocument> {
  constructor(userId: string) {
    super("subscriptions", userId, SubscriptionSchema);
  }

  async getSubscription(): Promise<SubscriptionDocument | null> {
    return this.findOne();
  }

  async isPro(): Promise<boolean> {
    const sub = await this.getSubscription();
    if (!sub) return false;
    return sub.status === "active" && new Date(sub.currentPeriodEnd).getTime() > Date.now();
  }

  async updateSubscription(data: {
    provider: "razorpay";
    planId: string;
    status: "active" | "cancelled" | "expired";
    currentPeriodEnd: Date;
    providerRef: string;
  }): Promise<SubscriptionDocument> {
    return this.upsert(
      {},
      {
        provider: data.provider,
        planId: data.planId,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        providerRef: data.providerRef,
        updatedAt: new Date(),
      }
    );
  }
}

export function getSubscriptionRepository(userId: string): SubscriptionRepository {
  return new SubscriptionRepository(userId);
}
