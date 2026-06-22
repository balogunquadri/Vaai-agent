import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  const clientId = process.env.ZAPIER_CLIENT_ID;
  const authUrl = process.env.ZAPIER_AUTH_URL; // e.g. https://zapier.com/oauth/authorize

  if (!clientId || !authUrl) {
    // Simulate OAuth flow when not configured
    const redirectUrl = `${origin}/auth/zapier-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`;
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUri = `${origin}/auth/zapier-callback`;
  const params: Record<string, string> = { client_id: clientId, redirect_uri: redirectUri, state: userId };
  if (process.env.ZAPIER_SCOPE) params.scope = process.env.ZAPIER_SCOPE;

  const url = `${authUrl}?${new URLSearchParams(params).toString()}`;
  return NextResponse.redirect(url);
}
