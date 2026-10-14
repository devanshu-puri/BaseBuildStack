import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { GET as getExport } from "@/app/api/me/export/route";
import { GET as getMe, DELETE as deleteMe } from "@/app/api/me/route";
import { GET as getHealth } from "@/app/api/health/route";
import {
  getUserRepository,
  getBookmarkRepository,
  getProgressRepository,
  getXpRepository,
} from "@/lib/db/repositories";
import { clearMemoryStoresForTest } from "@/lib/db/repository";
import { getDb } from "@/lib/db/client";

describe("Account Management & Health Routes", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    clearMemoryStoresForTest();
    try {
      const db = await getDb();
      await db.collection("users").deleteMany({ id: { $regex: /^acc_/ } });
      await db.collection("bookmarks").deleteMany({ userId: { $regex: /^acc_/ } });
      await db.collection("progress").deleteMany({ userId: { $regex: /^acc_/ } });
      await db.collection("xp_events").deleteMany({ userId: { $regex: /^acc_/ } });
    } catch {
      // offline fallback
    }
  });

  describe("Health Check Route (/api/health)", () => {
    it("returns healthy service status and rate limit headers", async () => {
      const req = new Request("http://localhost:3000/api/health");
      const res = await getHealth(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.service).toBe("basebuildstack");
      expect(data.deterministicEngine).toBe("active");
      expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
    });
  });

  describe("Data Export Route (/api/me/export)", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const res = await getExport();
      expect(res.status).toBe(401);
    });

    it("exports all user-owned data in structured JSON", async () => {
      const mockUser = {
        id: "acc_export_user_1",
        email: "alice@example.com",
        name: "Alice",
        role: "user" as const,
        targetRole: "ML Engineer",
        stack: ["Python", "PyTorch"],
        plan: "free" as const,
        createdAt: new Date(),
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

      // Seed data
      await getUserRepository().create(mockUser);
      await getBookmarkRepository(mockUser.id).toggleBookmark(
        "m1",
        "prob_1",
        "Two Sum"
      );
      await getProgressRepository(mockUser.id).setProgress(
        "m1",
        "prob_1",
        "completed",
        2
      );
      await getXpRepository(mockUser.id).awardXp(
        "lesson_complete",
        50,
        "rag_lesson"
      );

      const res = await getExport();
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Disposition")).toContain(
        `basebuildstack-export-${mockUser.id}.json`
      );

      const data = await res.json();
      expect(data.userId).toBe(mockUser.id);
      expect(data.bookmarks).toHaveLength(1);
      expect(data.bookmarks[0].itemId).toBe("prob_1");
      expect(data.progress).toHaveLength(1);
      expect(data.xp.totalXp).toBe(50);
    });
  });

  describe("Account Route (/api/me)", () => {
    it("returns 401 if unauthenticated on GET /api/me", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const res = await getMe();
      expect(res.status).toBe(401);
    });

    it("returns user profile and entitlement status on GET /api/me", async () => {
      const mockUser = {
        id: "acc_me_user_1",
        email: "me@example.com",
        name: "Dev",
        role: "user" as const,
        targetRole: "Frontend Engineer",
        stack: ["React"],
        plan: "free" as const,
        createdAt: new Date(),
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      await getUserRepository().create(mockUser);

      const res = await getMe();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.user.email).toBe("me@example.com");
      expect(data.entitlements.isPro).toBe(false);
    });

    it("deletes user account and purges user-scoped data without touching other users", async () => {
      const userA = {
        id: "acc_purge_a",
        email: "a@example.com",
        role: "user" as const,
        targetRole: "Full Stack",
        stack: [],
        plan: "free" as const,
        createdAt: new Date(),
      };
      const userB = {
        id: "acc_stay_b",
        email: "b@example.com",
        role: "user" as const,
        targetRole: "Full Stack",
        stack: [],
        plan: "free" as const,
        createdAt: new Date(),
      };

      await getUserRepository().create(userA);
      await getUserRepository().create(userB);

      await getBookmarkRepository(userA.id).toggleBookmark(
        "m1",
        "card_a",
        "Card A"
      );
      await getBookmarkRepository(userB.id).toggleBookmark(
        "m1",
        "card_b",
        "Card B"
      );

      // Authenticated as User A
      vi.mocked(getCurrentUser).mockResolvedValue(userA);

      const deleteRes = await deleteMe();
      expect(deleteRes.status).toBe(200);

      // Verify User A is deleted
      const foundA = await getUserRepository().findById(userA.id);
      expect(foundA).toBeNull();
      const bookmarksA = await getBookmarkRepository(userA.id).getBookmarks();
      expect(bookmarksA).toHaveLength(0);

      // Verify User B is completely untouched
      const foundB = await getUserRepository().findById(userB.id);
      expect(foundB).not.toBeNull();
      const bookmarksB = await getBookmarkRepository(userB.id).getBookmarks();
      expect(bookmarksB).toHaveLength(1);
    });
  });
});
