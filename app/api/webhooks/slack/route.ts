import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import crypto from "crypto";

function verifySlackSignature(signingSecret: string, timestamp: string | null, body: string, signature: string | null) {
  if (!timestamp || !signature) return false;
  const ts = parseInt(timestamp, 10);
  if (Math.abs(Date.now() / 1000 - ts) > 60 * 5) return false; // older than 5 minutes
  const basestring = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac("sha256", signingSecret).update(basestring).digest("hex");
  const computed = `v0=${hmac}`;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signingSecret = process.env.SLACK_SIGNING_SECRET || "";
    const timestamp = request.headers.get("x-slack-request-timestamp");
    const signature = request.headers.get("x-slack-signature");

    if (signingSecret) {
      const ok = verifySlackSignature(signingSecret, timestamp, raw, signature);
      if (!ok) return NextResponse.json({ error: "Invalid Slack signature" }, { status: 401 });
    }

    const payload = JSON.parse(raw);

    // URL verification challenge
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Event callback
    if (payload.type === "event_callback") {
      const event = payload.event;
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

      const itemId = event.event_ts || event.ts || `${payload.event_id || Math.random().toString(36).slice(2,9)}`;
      const title = event.type || event.subtype || "Slack Event";
      const text = event.text || JSON.stringify(event).slice(0, 1000);

      try {
        await admin.database.from("briefings_list").insert([{
          user_id: null,
          platform: "slack",
          item_id: itemId,
          title,
          body: text,
          metadata: event,
          created_at: new Date().toISOString()
        }]);
      } catch (dbErr) {
        console.warn("Failed to insert Slack webhook event:", dbErr);
      }

      // Respond quickly to Slack
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (err: any) {
    console.error("Slack webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
