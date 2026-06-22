import { NextResponse } from "next/server";
import { revokeToken, clearLarkIntegration } from "@/lib/larkClient";
import { createAdminClient } from "@insforge/sdk";

const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const { data: existing } = await admin.database.from("integrations").select("state").eq("user_id", userId).eq("platform", "lark").maybeSingle();
    const token = existing?.state?.access_token;
    if (token) await revokeToken(token).catch(() => {});

    await clearLarkIntegration(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lark disconnect failed", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
