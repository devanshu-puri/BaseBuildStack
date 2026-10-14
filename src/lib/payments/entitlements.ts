import { getSubscriptionRepository, getUserRepository } from "@/lib/db/repositories";
import { EntitlementStatus } from "./types";

/**
 * Server-side entitlement verification.
 * Always resolves deterministically on the server without trusting client state.
 */
export async function checkEntitlements(userId: string): Promise<EntitlementStatus> {
  if (process.env.PRO_OVERRIDE === "true" || process.env.NEXT_PUBLIC_PRO_OVERRIDE === "true") {
    return {
      plan: "pro",
      isPro: true,
      features: {
        maxBlitzPerDay: Infinity,
        canUploadResume: true,
        canIndexRepo: true,
        canAccessAllLessons: true,
        canAccessRubricGrading: true,
      },
    };
  }

  if (!userId) {
    return {
      plan: "free",
      isPro: false,
      features: {
        maxBlitzPerDay: 5,
        canUploadResume: false,
        canIndexRepo: false,
        canAccessAllLessons: false,
        canAccessRubricGrading: false,
      },
    };
  }

  const subRepo = getSubscriptionRepository(userId);
  const isSubPro = await subRepo.isPro();

  const userRepo = getUserRepository();
  const user = await userRepo.findById(userId);
  const isUserPro = user?.plan === "pro";

  const isPro = isSubPro || isUserPro;

  if (isPro) {
    return {
      plan: "pro",
      isPro: true,
      features: {
        maxBlitzPerDay: Infinity,
        canUploadResume: true,
        canIndexRepo: true,
        canAccessAllLessons: true,
        canAccessRubricGrading: true,
      },
    };
  }

  return {
    plan: "free",
    isPro: false,
    features: {
      maxBlitzPerDay: 5,
      canUploadResume: false,
      canIndexRepo: false,
      canAccessAllLessons: false,
      canAccessRubricGrading: false,
    },
  };
}
