import { NextResponse, NextRequest } from "next/server";
import { sendCodeRequest } from "@/lib/telegramClient";
import { deriveUserIdFromRequest } from "@/lib/authHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { userId, phoneNumber } = body;
    // Prefer deriving userId server-side from session/cookie/header
    const derived = deriveUserIdFromRequest(request as any);
    if (derived) userId = derived;
    if (!userId || !phoneNumber) return NextResponse.json({ error: "userId and phoneNumber required" }, { status: 400 });

    const res = await sendCodeRequest(userId, phoneNumber);
    return NextResponse.json({ success: true, res });
  } catch (err: any) {
    console.error("/api/auth/telegram/connect error:", err);
    return NextResponse.json({ error: err.message || "internal" }, { status: 500 });
  }
}
