import { NextResponse } from "next/server";
import tokenManager from "../../../../../lib/tokenManager";

export async function POST(request: Request, { params }: { params: { platform: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    const { platform } = params;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const newState = await tokenManager.refreshAndSaveIntegration(userId, platform);
    return NextResponse.json({ ok: true, platform, userId, newState });
  } catch (err) {
    console.error("refresh route error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
