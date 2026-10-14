import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Foundation smoke test", () => {
  it("vitest is configured and running", () => {
    expect(1 + 1).toBe(2);
  });

  it("zod parses schemas correctly at boundaries", () => {
    const UserSchema = z.object({
      id: z.string(),
      email: z.string().email(),
    });

    const parsed = UserSchema.parse({
      id: "u_123",
      email: "engineer@basebuildstack.internal",
    });

    expect(parsed.id).toBe("u_123");
    expect(parsed.email).toBe("engineer@basebuildstack.internal");
  });
});
