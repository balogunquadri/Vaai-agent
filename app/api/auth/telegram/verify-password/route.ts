import { NextResponse, NextRequest } from "next/server";
import { verifyPassword } from "@/lib/telegramClient";
import { deriveUserIdFromRequest } from "@/lib/authHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { userId, password } = body;
    const derived = deriveUserIdFromRequest(request as any);
    if (derived) userId = derived;
    if (!userId || !password) return NextResponse.json({ error: "userId and password required" }, { status: 400 });

    const result = await verifyPassword(userId, password);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("/api/auth/telegram/verify-password error:", err);
    return NextResponse.json({ error: err.message || "internal" }, { status: 500 });
  }
}
