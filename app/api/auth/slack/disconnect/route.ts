import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    // Clear stored tokens and mark disconnected
    const { data: existing } = await admin.database
      .from("integrations")
      .select("id, state")
      .eq("user_id", userId)
      .eq("platform", "slack")
      .maybeSingle();

    if (existing) {
      await admin.database
        .from("integrations")
        .update({ connected: false, state: {}, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    // Optionally attempt to revoke token via Slack API if present
    try {
      const token = existing?.state?.access_token || existing?.state?.bot_token;
      if (token) {
        await fetch("https://slack.com/api/auth.revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token }),
        });
      }
    } catch (err) {
      console.warn("Slack token revocation failed:", err);
    }

    return NextResponse.json({ success: true, message: "Slack disconnected" });
  } catch (error: any) {
    console.error("Error disconnecting Slack:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
