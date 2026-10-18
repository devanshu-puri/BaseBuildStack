import { describe, it, expect, vi } from "vitest";
import { getCurrentUser } from "@/lib/auth/session";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth/auth";

type MockSession = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  expires: string;
};

describe("Auth Session Boundaries", () => {
  it("returns null when no active session exists", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns AuthenticatedUser when valid session exists", async () => {
    const mockSession: MockSession = {
      user: {
        id: "u_candidate_999",
        email: "candidate@basebuildstack.internal",
        name: "Test Candidate",
      },
      expires: "2099-01-01T00:00:00.000Z",
    };

    vi.mocked(auth).mockResolvedValueOnce(mockSession as unknown as Awaited<ReturnType<typeof auth>>);

    const user = await getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.id).toBe("u_candidate_999");
    expect(user?.email).toBe("candidate@basebuildstack.internal");
  });
});

import { hashPassword, verifyPassword } from "@/lib/security/password";

describe("Password Security & scrypt Hashing", () => {
  it("generates unique salt and correctly verifies a matching password", async () => {
    const pwd = "SecurePassword123!";
    const hash = await hashPassword(pwd);
    expect(hash).toContain(":");

    const isValid = await verifyPassword(pwd, hash);
    expect(isValid).toBe(true);
  });

  it("strictly rejects incorrect passwords", async () => {
    const hash = await hashPassword("RightPassword123!");
    const isValid = await verifyPassword("WrongPassword456!", hash);
    expect(isValid).toBe(false);
  });

  it("generates different salts for identical passwords", async () => {
    const pwd = "IdenticalPassword!";
    const hash1 = await hashPassword(pwd);
    const hash2 = await hashPassword(pwd);
    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(pwd, hash1)).toBe(true);
    expect(await verifyPassword(pwd, hash2)).toBe(true);
  });

  it("handles malformed hash inputs gracefully without throwing", async () => {
    expect(await verifyPassword("test", "")).toBe(false);
    expect(await verifyPassword("test", "corruptedhashstring")).toBe(false);
    expect(await verifyPassword("test", "nonhexsalt:nonhexkey")).toBe(false);
  });
});
