import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    // Simulate callback for local/dev
    const html = `<!doctype html><html><body><script>localStorage.setItem('outlook_connected','true');window.location.href='${origin}/dashboard/integrations?connected=outlook'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: clientId,
      scope: "openid profile offline_access User.Read Mail.Read Mail.ReadWrite Calendars.ReadWrite Contacts.Read",
      code,
      redirect_uri: `${origin}/auth/outlook-callback`,
      grant_type: "authorization_code",
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Outlook token exchange failed", data);
      return NextResponse.json({ error: "Outlook token exchange failed", details: data }, { status: 400 });
    }

    const stateToSave: any = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
      token_type: data.token_type,
    };

    if (userId) {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "outlook").maybeSingle();
      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform: "outlook", connected: true, state: stateToSave }]);
      }
    }

    const html = `<!doctype html><html><body><script>localStorage.setItem('outlook_connected','true');window.location.href='${origin}/dashboard/integrations?connected=outlook'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Outlook callback error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
