import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Optional secret header check
    const expected = process.env.ZAPIER_WEBHOOK_SECRET;
    const provided = request.headers.get("x-webhook-secret");
    if (expected && expected !== provided) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    try {
      await admin.database.from("briefings_list").insert([{
        user_id: null,
        platform: "zapier",
        item_id: body.id || `zap_${Date.now()}`,
        title: body.title || body.name || "Zapier Event",
        body: JSON.stringify(body).slice(0, 4000),
        metadata: body,
        created_at: new Date().toISOString()
      }]);
    } catch (dbErr) {
      console.warn("Failed to insert Zapier webhook payload:", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Zapier webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
