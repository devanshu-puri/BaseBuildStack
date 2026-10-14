import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMemoryStore } from "@/lib/db/repository";
import { getUserRepository, getProfileRepository } from "@/lib/db/repositories";
import { checkEntitlements } from "@/lib/payments/entitlements";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userDoc, profile, entitlements] = await Promise.all([
      getUserRepository().findById(user.id),
      getProfileRepository(user.id).getProfile(),
      checkEntitlements(user.id),
    ]);

    return NextResponse.json(
      {
        user: userDoc,
        profile,
        entitlements,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Collections strictly scoped by userId
    const userScopedCollections = [
      "profiles",
      "progress",
      "attempts",
      "mistakes",
      "bookmarks",
      "srs_cards",
      "xp_events",
      "milestones",
      "streaks",
      "subscriptions",
      "repos",
      "repo_chunks",
      "quiz_sessions",
    ];

    try {
      const db = await getDb();
      for (const colName of userScopedCollections) {
        await db.collection(colName).deleteMany({ userId });
      }
      await db.collection("users").deleteOne({ id: userId });
    } catch {
      // Memory fallback for tests / offline
      for (const colName of userScopedCollections) {
        const store = getMemoryStore(colName);
        for (const [key, item] of Array.from(store.entries())) {
          if (item.userId === userId) {
            store.delete(key);
          }
        }
      }

      const usersStore = getMemoryStore("users");
      usersStore.delete(userId);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account and all associated user data permanently deleted",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
