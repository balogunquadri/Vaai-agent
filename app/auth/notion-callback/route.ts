import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server OAuth configuration is missing" }, { status: 500 });
  }

  try {
    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/notion-callback`,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.access_token) {
      return NextResponse.json({ error: "Failed to exchange Notion code", details: data }, { status: 400 });
    }

    if (userId) {
      try {
        const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
        const { data: existing } = await admin.database
          .from("integrations")
          .select("id, state")
          .eq("user_id", userId)
          .eq("platform", "notion")
          .maybeSingle();

        const stateToSave: any = {
          access_token: data.access_token,
          bot_id: data.bot_id || null,
          owner: data.owner || null,
          workspace: data.workspace || null,
        };

        if (existing) {
          await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await admin.database.from("integrations").insert([{ user_id: userId, platform: "notion", connected: true, state: stateToSave }]);
        }
      } catch (dbErr) {
        console.error("Failed to save Notion token to integrations DB:", dbErr);
      }
    }

    const htmlContent = `<!doctype html><html><head><title>Notion Authentication</title></head><body style="background:#030014;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center"><p>Completing Notion connection...</p></div><script>try{localStorage.setItem('notion_connected','true');window.location.href='${origin}/dashboard/integrations?connected=notion';}catch(e){alert('Failed to finalize Notion connection');}</script></body></html>`;

    return new NextResponse(htmlContent, { headers: { "Content-Type": "text/html" } });
  } catch (error: any) {
    console.error("Notion OAuth callback error:", error);
    return NextResponse.json({ error: "Internal server error during Notion OAuth exchange", details: error.message }, { status: 500 });
  }
}
