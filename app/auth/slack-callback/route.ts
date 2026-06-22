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

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server OAuth configuration is missing" }, { status: 500 });
  }

  try {
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/auth/slack-callback`
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.ok) {
      return NextResponse.json({ error: "Failed to exchange Slack code", details: data }, { status: 400 });
    }

    // Save to integrations table
    if (userId) {
      try {
        const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

        const { data: existing } = await admin.database
          .from("integrations")
          .select("id, state")
          .eq("user_id", userId)
          .eq("platform", "slack")
          .maybeSingle();

        const stateToSave: any = {
          access_token: data.access_token || data.authed_user?.access_token || null,
          bot_token: data.bot_token || data.access_token || null,
          team: data.team || null,
          scope: data.scope || null,
          authed_user: data.authed_user || null,
        };

        if (existing) {
          await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await admin.database.from("integrations").insert([{ user_id: userId, platform: "slack", connected: true, state: stateToSave }]);
        }
      } catch (dbErr) {
        console.error("Failed to save Slack token to integrations DB:", dbErr);
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Slack Authentication</title>
        </head>
        <body style="background: #030014; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <div style="border: 4px solid #8b5cf6; border-top-color: transparent; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 16px auto; animation: spin 1s linear infinite;"></div>
            <p style="font-size: 14px; font-weight: 500;">Completing Slack connection...</p>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
          <script>
            try {
              localStorage.setItem('slack_connected', 'true');
              window.location.href = '${origin}/dashboard/integrations?connected=slack';
            } catch (e) {
              console.error(e);
              alert('Failed to finalize Slack connection.');
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, { headers: { "Content-Type": "text/html" } });
  } catch (error: any) {
    console.error("Slack OAuth callback error:", error);
    return NextResponse.json({ error: "Internal server error during Slack OAuth exchange", details: error.message }, { status: 500 });
  }
}
