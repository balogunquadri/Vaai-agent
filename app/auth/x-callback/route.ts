import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/dashboard/integrations?connected=x`);
  }

  try {
    // Exchange code for token - Twitter OAuth2.0 token exchange
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/x-callback`,
        code_verifier: (() => {
          try {
            const cookie = request.headers.get("cookie") || "";
            const found = cookie.split(";").map(s=>s.trim()).find(s=>s.startsWith("x_pkce="));
            if (found) return decodeURIComponent(found.split("=")[1]);
          } catch (e) { }
          return "challenge";
        })(),
      }).toString(),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok || data.error) {
      console.error("Twitter/X token exchange failed", data);
      return NextResponse.json({ error: "X token exchange failed", details: data }, { status: 400 });
    }

    const stateToSave = { access_token: data.access_token, refresh_token: data.refresh_token, scope: data.scope };

    if (userId) {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "x").maybeSingle();
      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform: "x", connected: true, state: stateToSave }]);
      }
    }

    const html = `<!doctype html><html><body><script>localStorage.setItem('x_connected','true');window.location.href='${origin}/dashboard/integrations?connected=x'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("X callback error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
