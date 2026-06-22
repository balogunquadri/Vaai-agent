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
      .eq("platform", "linkedin")
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const state = existing.state || {};

    // If refresh_token is available, attempt refresh via LinkedIn token endpoint
    if (state.refresh_token && process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", state.refresh_token);
      params.append("client_id", process.env.LINKEDIN_CLIENT_ID!);
      params.append("client_secret", process.env.LINKEDIN_CLIENT_SECRET!);

      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const tokenData = await tokenRes.json();
      if (tokenRes.ok && tokenData.access_token) {
        const newState = { ...state, access_token: tokenData.access_token, expires_in: tokenData.expires_in, fetched_at: new Date().toISOString() };
        await insforge.database.from("integrations").update({ state: newState, updated_at: new Date().toISOString() }).eq("id", existing.id);
        return NextResponse.json({ accessToken: tokenData.access_token, newState });
      }
    }

    // Fallback: return stored access token (may be undefined)
    return NextResponse.json({ accessToken: state.access_token || null });
  } catch (err) {
    console.error("LinkedIn token refresh failed:", err);
    return NextResponse.json({ error: "token_failed" }, { status: 500 });
  }
}
