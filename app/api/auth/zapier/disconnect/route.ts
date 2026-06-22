import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId") || "";
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    const { data: existing } = await admin.database
      .from("integrations")
      .select("id, state")
      .eq("user_id", userId)
      .eq("platform", "zapier")
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ ok: true, message: "No Zapier integration found" });
    }

    // Attempt to revoke token via configured endpoint if available
    const token = existing.state?.access_token || existing.state?.token;
    const revokeUrl = process.env.ZAPIER_REVOKE_URL;
    try {
      if (token && revokeUrl) {
        const params = new URLSearchParams();
        params.set("token", token);
        if (process.env.ZAPIER_CLIENT_ID) params.set("client_id", process.env.ZAPIER_CLIENT_ID);
        if (process.env.ZAPIER_CLIENT_SECRET) params.set("client_secret", process.env.ZAPIER_CLIENT_SECRET);
        await fetch(revokeUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
      }
    } catch (err) {
      console.warn("Zapier token revoke failed", err);
    }

    // Mark integration disconnected and clear sensitive state
    await admin.database.from("integrations").update({ connected: false, state: {}, updated_at: new Date().toISOString() }).eq("id", existing.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Zapier disconnect error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
