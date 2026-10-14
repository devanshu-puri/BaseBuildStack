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
