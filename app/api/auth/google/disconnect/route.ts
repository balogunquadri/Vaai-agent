import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    // Attempt to revoke token(s) for both google and google_drive entries
    const { data: existingGoogle } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).in("platform", ["google", "google_drive"]);
    try {
      if (existingGoogle && Array.isArray(existingGoogle)) {
        for (const row of existingGoogle) {
          const token = row.state?.access_token || row.state?.refresh_token;
          if (token) {
            try {
              await fetch("https://oauth2.googleapis.com/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ token }).toString(),
              });
            } catch (e) {
              console.warn("Google revoke failed for token", e);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error during google token revoke loop", e);
    }

    await admin.database.from("integrations").update({ connected: false, state: null, updated_at: new Date().toISOString() }).eq("user_id", userId).in("platform", ["google", "google_drive"]);

    return NextResponse.json({ ok: true, platform: "google", userId });
  } catch (err) {
    console.error("google disconnect error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
