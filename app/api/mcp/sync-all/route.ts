import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { syncUserIntegrations } from "@/lib/mcpParsers";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-sync-secret") || "";
    if (process.env.MCP_SYNC_SECRET && secret !== process.env.MCP_SYNC_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: users, error } = await admin.database.from("users").select("id");
    if (error) {
      console.error("Failed to fetch users for MCP sync:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let totalSynced = 0;
    for (const u of users || []) {
      try {
        const res = await syncUserIntegrations(u.id);
        totalSynced += res?.synced || 0;
      } catch (err) {
        console.warn(`Sync failed for user ${u.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, users: (users || []).length, totalSynced });
  } catch (err: any) {
    console.error("MCP sync-all failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
