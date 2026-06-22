import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "jira")
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const state = existing.state || {};

    // If refresh_token is available and client creds present, attempt refresh
    if (state.refresh_token && process.env.JIRA_CLIENT_ID && process.env.JIRA_CLIENT_SECRET) {
      try {
        const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: process.env.JIRA_CLIENT_ID,
            client_secret: process.env.JIRA_CLIENT_SECRET,
            refresh_token: state.refresh_token,
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenRes.ok && tokenData.access_token) {
          const newState = { ...state, access_token: tokenData.access_token, expires_in: tokenData.expires_in, fetched_at: new Date().toISOString() };
          await insforge.database.from("integrations").update({ state: newState, updated_at: new Date().toISOString() }).eq("id", existing.id);
          return NextResponse.json({ accessToken: tokenData.access_token, newState });
        }
      } catch (err) {
        console.error("Jira token refresh failed:", err);
      }
    }

    return NextResponse.json({ accessToken: state.access_token || null });
  } catch (err) {
    console.error("Jira token endpoint error:", err);
    return NextResponse.json({ error: "token_failed" }, { status: 500 });
  }
}
