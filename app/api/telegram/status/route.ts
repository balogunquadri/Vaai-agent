import { NextResponse } from "next/server";
import { getTelegramStatus } from "@/lib/telegramClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const status = await getTelegramStatus(userId);
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error("/api/telegram/status error:", err);
    return NextResponse.json({ error: err.message || "internal" }, { status: 500 });
  }
}
