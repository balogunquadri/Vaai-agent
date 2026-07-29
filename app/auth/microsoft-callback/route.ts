import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || process.env.OUTLOOK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      `<!doctype html><html><body style="background:#030014;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center;"><h2>Configuration Missing</h2><p>MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET is not configured on the server.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/auth/microsoft-callback`,
        grant_type: "authorization_code",
      }).toString(),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Microsoft token exchange failed", data);
      return NextResponse.json({ error: "Microsoft token exchange failed", details: data }, { status: 400 });
    }

    const stateToSave = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      scope: data.scope,
      id_token: data.id_token,
    };

    if (userId) {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "microsoft").maybeSingle();
      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform: "microsoft", connected: true, state: stateToSave }]);
      }
    }

    const html = `<!doctype html><html><body><script>localStorage.setItem('microsoft_connected','true');window.location.href='${origin}/dashboard/integrations?connected=microsoft'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Microsoft callback error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
