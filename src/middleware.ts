import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

export default auth((req) => {
  const isDevOrTestBypass =
    process.env.NODE_ENV !== "production" &&
    (req.cookies.has("authjs.session-token") ||
      req.cookies.has("__Secure-authjs.session-token") ||
      req.headers.get("x-e2e-test") === "1");

  const isLoggedIn = !!req.auth || isDevOrTestBypass;
  const { pathname } = req.nextUrl;

  // Protected application routes
  const isAppRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/bookmarks") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/m1") ||
    pathname.startsWith("/m2") ||
    pathname.startsWith("/m3") ||
    pathname.startsWith("/m4");

  if (isAppRoute && !isLoggedIn) {
    // In dev mode / demo, allow bypass or redirect
    // If not logged in, redirect to sign-in with callback
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
});

export const config = {
  matcher: [
    "/home/:path*",
    "/progress/:path*",
    "/bookmarks/:path*",
    "/settings/:path*",
    "/m1/:path*",
    "/m2/:path*",
    "/m3/:path*",
    "/m4/:path*",
  ],
};
