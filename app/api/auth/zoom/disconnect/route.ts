import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      // Try to revoke refresh_token with Zoom if present
      const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "zoom").maybeSingle();
      if (existing && existing.state && existing.state.refresh_token) {
        try {
          const clientId = process.env.ZOOM_CLIENT_ID;
          const clientSecret = process.env.ZOOM_CLIENT_SECRET;
          if (clientId && clientSecret) {
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
            await fetch(`https://zoom.us/oauth/revoke`, {
              method: "POST",
              headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ token: existing.state.refresh_token }).toString(),
            });
          }
        } catch (err) {
          console.error("Failed to revoke Zoom token", err);
        }
      }

      await admin.database.from("integrations").update({ connected: false, state: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "zoom");

    return NextResponse.json({ ok: true, platform: "zoom", userId });
  } catch (err) {
    console.error("zoom disconnect error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
