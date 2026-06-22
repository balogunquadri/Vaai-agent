import { NextResponse } from "next/server";
import { syncUserIntegrations } from "@/lib/mcpParsers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const result = await syncUserIntegrations(userId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("MCP sync failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
