import { NextResponse, NextRequest } from "next/server";
import { disconnectTelegram } from "@/lib/telegramClient";
import { deriveUserIdFromRequest } from "@/lib/authHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { userId } = body;
    const derived = deriveUserIdFromRequest(request as any);
    if (derived) userId = derived;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const result = await disconnectTelegram(userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("/api/auth/telegram/disconnect error:", err);
    return NextResponse.json({ error: err.message || "internal" }, { status: 500 });
  }
}
