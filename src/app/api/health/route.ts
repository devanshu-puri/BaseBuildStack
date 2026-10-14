import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";

export async function GET(req: Request) {
  const clientId = getClientIdentifier(req);
  const rateLimit = await checkRateLimit(`health_${clientId}`, 120, 60_000);

  const response = NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: "basebuildstack",
      deterministicEngine: "active",
    },
    {
      status: rateLimit.success ? 200 : 429,
    }
  );

  applySecurityHeaders(response.headers);
  response.headers.set("X-RateLimit-Limit", rateLimit.limit.toString());
  response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
  response.headers.set("X-RateLimit-Reset", rateLimit.reset.toString());

  return response;
}
