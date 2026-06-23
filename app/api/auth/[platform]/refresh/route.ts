import { NextResponse, NextRequest } from "next/server";
import tokenManager from "@/lib/tokenManager";

export async function POST(request: NextRequest, context: { params: Promise<any> }) {
  try {
    const params = context && context.params ? await context.params : ({} as any);
    const { platform } = params || { platform: undefined };
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });

    const newState = await tokenManager.refreshAndSaveIntegration(userId, platform);
    return NextResponse.json({ ok: true, platform, userId, newState });
  } catch (err) {
    console.error("refresh route error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
