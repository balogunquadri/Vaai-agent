import { NextResponse } from "next/server";
import { getAppRecentItems } from "@/lib/mcpApps";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const platformId = searchParams.get("platformId");

    if (!userId || !platformId) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, platformId" },
        { status: 400 }
      );
    }

    const items = await getAppRecentItems(userId, platformId, 10);
    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error(`Failed to fetch feed:`, error);
    return NextResponse.json(
      { error: "Internal server error during feed compilation", details: error.message },
      { status: 500 }
    );
  }
}
