import { NextResponse } from "next/server";
import { revokeMsTokens } from "@/lib/microsoftClient";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    await revokeMsTokens(userId);
    return NextResponse.json({ ok: true, platform: "microsoft_teams", userId });
  } catch (err) {
    console.warn("Microsoft disconnect failed", err);
    return NextResponse.json({ error: "disconnect_failed" }, { status: 500 });
  }
}
