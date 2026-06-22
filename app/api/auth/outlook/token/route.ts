import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
  try {
    const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "outlook").maybeSingle();
    if (!existing || !existing.state?.refresh_token) return NextResponse.json({ error: "no_refresh_token" }, { status: 404 });

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const tenant = process.env.OUTLOOK_TENANT_ID || "common";

    if (!clientId || !clientSecret) return NextResponse.json({ error: "client_secrets_missing" }, { status: 500 });

    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: existing.state.refresh_token,
      scope: "openid profile offline_access User.Read Mail.Read Mail.ReadWrite Calendars.ReadWrite Contacts.Read",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Outlook refresh failed", data);
      return NextResponse.json({ error: "refresh_failed", details: data }, { status: 400 });
    }

    const newState = {
      ...existing.state,
      access_token: data.access_token,
      refresh_token: data.refresh_token || existing.state.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
      token_type: data.token_type,
    };

    await admin.database.from("integrations").update({ state: newState, updated_at: new Date().toISOString() }).eq("id", existing.id);

    return NextResponse.json({ success: true, newState, accessToken: data.access_token });
  } catch (err) {
    console.error("Outlook token route error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
