import { CreateOrderResponse, PlanId } from "./types";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayInstance {
  open: () => void;
  close?: () => void;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

let scriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically load official Razorpay Checkout SDK.
 */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise<boolean>((resolve) => {
    // Check if script tag already exists
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay checkout script from CDN.");
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Launch Razorpay checkout flow with fallback to test fulfillment if keys are mock.
 */
export async function launchRazorpayCheckout({
  order,
  userEmail,
  userName,
  planId,
  onSuccess,
  onError,
  onDismiss,
}: {
  order: CreateOrderResponse;
  userEmail?: string;
  userName?: string;
  planId: PlanId;
  onSuccess: (data: { paymentId: string; orderId: string }) => void;
  onError: (errorMsg: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  // If in pure mock mode without a real Razorpay test key, use instant test payment flow
  if (order.keyId === "rzp_test_mock_key" || !order.keyId) {
    try {
      const res = await fetch("/api/payments/simulate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, planId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess({ paymentId: `sim_${order.orderId}`, orderId: order.orderId });
      } else {
        onError(data.error || "Simulation failed.");
      }
    } catch {
      onError("Network error during test checkout simulation.");
    }
    return;
  }

  // Load Razorpay script
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    // If Razorpay CDN failed to load (offline or blocked), fallback to sandbox simulation
    console.warn("Razorpay script not available; falling back to sandbox fulfillment.");
    try {
      const res = await fetch("/api/payments/simulate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, planId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess({ paymentId: `sim_${order.orderId}`, orderId: order.orderId });
        return;
      }
    } catch {
      // ignore
    }
    onError("Unable to load Razorpay payment gateway script. Please check your internet connection.");
    return;
  }

  try {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "BaseBuildStack",
      description: "BaseBuildStack Pro Membership",
      order_id: order.orderId,
      prefill: {
        email: userEmail || "",
        name: userName || "Engineer",
      },
      theme: {
        color: "#5E4EF0",
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
      handler: async (response: RazorpayPaymentResponse) => {
        try {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            onSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
          } else {
            onError(verifyData.error || "Signature verification failed.");
          }
        } catch {
          onError("Network error verifying payment result.");
        }
      },
    });

    rzp.open();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error opening Razorpay checkout";
    onError(msg);
  }
}
