import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    const botToken = body.botToken;
    if (!userId || !botToken) return NextResponse.json({ error: "userId and botToken required" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "discord").maybeSingle();
    const stateToSave = { discordToken: botToken };
    if (existing) {
      await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await admin.database.from("integrations").insert([{ user_id: userId, platform: "discord", connected: true, state: stateToSave }]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("save-bot-token error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
