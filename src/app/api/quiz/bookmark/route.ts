import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookmarkRepository } from "@/lib/db/repositories/bookmark-repo";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const body = await req.json();
    const { questionId, title } = body;

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    const bookmarkRepo = getBookmarkRepository(userId);
    const result = await bookmarkRepo.toggleBookmark("m2", questionId, title);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to toggle question bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    const bookmarkRepo = getBookmarkRepository(userId);

    if (questionId) {
      const isBookmarked = await bookmarkRepo.isBookmarked("m2", questionId);
      return NextResponse.json({ bookmarked: isBookmarked });
    }

    const allBookmarks = await bookmarkRepo.getBookmarks("m2");
    return NextResponse.json({ bookmarks: allBookmarks });
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}
