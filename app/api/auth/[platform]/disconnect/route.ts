import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: NextRequest, context: { params: Promise<any> }) {
  const params = context && context.params ? await context.params : ({} as any);
  const { platform } = params || { platform: undefined };
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    // Mark disconnected and clear sensitive state
    await admin.database.from("integrations").update({ connected: false, state: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", platform);

    return NextResponse.json({ ok: true, platform, userId });
  } catch (err) {
    console.error("disconnect error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
