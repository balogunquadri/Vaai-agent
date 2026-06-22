import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/auth/zoom-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`);
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(`https://zoom.us/oauth/token?grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(
      `${origin}/auth/zoom-callback`
    )}`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Zoom token exchange failed", data);
      return NextResponse.json({ error: "Zoom token exchange failed", details: data }, { status: 400 });
    }

    const stateToSave = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      scope: data.scope,
    };

    if (userId) {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "zoom").maybeSingle();
      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform: "zoom", connected: true, state: stateToSave }]);
      }
    }

    const html = `<!doctype html><html><body><script>localStorage.setItem('zoom_connected','true');window.location.href='${origin}/dashboard/integrations?connected=zoom'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Zoom callback error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
