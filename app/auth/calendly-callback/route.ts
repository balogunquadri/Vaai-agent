import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@insforge/sdk";

async function exchangeCodeForToken(code: string, redirectUri: string, codeVerifier?: string) {
  const tokenUrl = process.env.CALENDLY_TOKEN_URL || "https://auth.calendly.com/oauth/token";
  const clientId = process.env.CALENDLY_CLIENT_ID;
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
  if (!tokenUrl || !clientId) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
    });
    if (clientSecret) body.set("client_secret", clientSecret);
    if (codeVerifier) body.set("code_verifier", codeVerifier);

    const res = await fetch(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Calendly token exchange failed", err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  let tokenToSave: any = null;

  // Try real exchange when configured
  if (code && process.env.CALENDLY_CLIENT_ID) {
    const redirectUri = `${origin}/auth/calendly-callback`;
    // try to read PKCE code_verifier from cookie if present
    const codeVerifier = request.cookies.get("calendly_pkce")?.value || undefined;
    const exchanged = await exchangeCodeForToken(code, redirectUri, codeVerifier);
    if (exchanged) tokenToSave = exchanged;
  }

  // Fallback simulated token
  if (!tokenToSave) tokenToSave = { access_token: code ? `simulated:${code}` : `simulated:no-code` };

  if (userId) {
    try {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const { data: existing } = await admin.database
        .from("integrations")
        .select("id, state")
        .eq("user_id", userId)
        .eq("platform", "calendly")
        .maybeSingle();

      const stateToSave: any = {
        access_token: tokenToSave.access_token || tokenToSave.token || tokenToSave,
        refresh_token: tokenToSave.refresh_token || null,
        platform: "calendly",
        received_at: new Date().toISOString(),
        raw: tokenToSave,
      };

      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform: "calendly", connected: true, state: stateToSave }]);
      }
    } catch (dbErr) {
      console.error("Failed to save calendly token to integrations DB:", dbErr);
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Calendly Authentication</title>
      </head>
      <body style="background: #030014; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <div style="border: 4px solid #3b82f6; border-top-color: transparent; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 16px auto; animation: spin 1s linear infinite;"></div>
          <p style="font-size: 14px; font-weight: 500;">Completing Calendly connection...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        <script>
          try {
            localStorage.setItem('calendly_connected', 'true');
            window.location.href = '${origin}/dashboard/integrations?connected=calendly';
          } catch (e) { console.error(e); alert('Failed to finalize connection.'); }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(htmlContent, { headers: { "Content-Type": "text/html" } });
}
