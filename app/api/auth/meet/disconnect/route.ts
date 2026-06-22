import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    // Try to revoke refresh_token if present
    const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "meet").maybeSingle();
    if (existing && existing.state && existing.state.refresh_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(existing.state.refresh_token)}`, { method: "POST" });
      } catch (err) {
        console.error("Failed to revoke Google token", err);
      }
    }

    await admin.database.from("integrations").update({ connected: false, state: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "meet");

    return NextResponse.json({ ok: true, platform: "meet", userId });
  } catch (err) {
    console.error("meet disconnect error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
