import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserRepository } from "@/lib/db/repositories/user-repo";
import { ProfileRepository } from "@/lib/db/repositories/profile-repo";
import { hashPassword } from "@/lib/security/password";
import { checkRateLimit } from "@/lib/security/rate-limit";

const RegisterSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password too long"),
  name: z.string().min(1, "Name is required").max(100).optional(),
  targetRole: z.string().default("AI Engineer"),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limiting (Anti-abuse & anti-bot)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkRateLimit(`register:${clientIp}`, 10, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    // 2. Strict Zod Boundary Validation
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration payload" },
        { status: 400 }
      );
    }

    const { email, password, name, targetRole } = parsed.data;
    const userRepo = getUserRepository();

    // 3. Prevent duplicate account collisions
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // 4. OWASP-compliant password hashing
    const passwordHash = await hashPassword(password);
    const userId = "u_" + globalThis.crypto.randomUUID();

    // 5. Persist user document
    const newUser = await userRepo.create({
      id: userId,
      email,
      name: name || email.split("@")[0],
      role: "user",
      targetRole,
      stack: [],
      plan: "free",
      passwordHash,
      createdAt: new Date(),
    });

    // 6. Initialize default user profile
    const profileRepo = new ProfileRepository(userId);
    await profileRepo.ensureProfile();

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          targetRole: newUser.targetRole,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
