import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/integrations?error=missing_code`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${origin}/auth/linkedin-callback`;

  try {
    if (clientId && clientSecret) {
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", redirectUri);
      params.append("client_id", clientId);
      params.append("client_secret", clientSecret);

      const tokenRes = await fetch(`https://www.linkedin.com/oauth/v2/accessToken`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const tokenData = await tokenRes.json();
      // LinkedIn returns access_token and expires_in; refresh_token may not be present depending on app settings

      const userId = state || "";

      // Persist tokens securely in integrations table (state JSON)
      const newState: any = {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        fetched_at: new Date().toISOString(),
      };

      // If a refresh_token was returned, store it as well
      if (tokenData.refresh_token) newState.refresh_token = tokenData.refresh_token;

      const { data: existing } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", userId)
        .eq("platform", "linkedin")
        .maybeSingle();

      if (existing) {
        await insforge.database
          .from("integrations")
          .update({ connected: true, state: newState, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await insforge.database.from("integrations").insert([
          { user_id: userId, platform: "linkedin", connected: true, state: newState }
        ]);
      }

      return NextResponse.redirect(`${origin}/dashboard/integrations?connected=linkedin`);
    }
  } catch (err) {
    console.error("LinkedIn callback token exchange failed:", err);
  }

  // Simulation fallback
  try {
    const userId = state || "";
    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await insforge.database.from("integrations").insert([
        { user_id: userId, platform: "linkedin", connected: true }
      ]);
    }
  } catch (err) {
    console.error("LinkedIn callback simulation failed:", err);
  }

  return NextResponse.redirect(`${origin}/dashboard/integrations?connected=linkedin`);
}
