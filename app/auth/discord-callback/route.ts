import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // If not configured, redirect to integrations with simulated flag
    const html = `<!doctype html><html><body><script>localStorage.setItem('discord_connected','true');window.location.href='${origin}/dashboard/integrations?connected=discord'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/discord-callback`,
      }).toString(),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok || data.error) {
      console.error("Discord token exchange failed", data);
      return NextResponse.json({ error: "Discord token exchange failed", details: data }, { status: 400 });
    }

    const stateToSave = { access_token: data.access_token, refresh_token: data.refresh_token, scope: data.scope, token_type: data.token_type, expires_in: data.expires_in };

    if (userId) {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const { data: existing } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "discord").maybeSingle();
      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform: "discord", connected: true, state: stateToSave }]);
      }
    }

    const html = `<!doctype html><html><body><script>localStorage.setItem('discord_connected','true');window.location.href='${origin}/dashboard/integrations?connected=discord'</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Discord callback error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
