import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    // Simulate OAuth when server config is missing
    return NextResponse.redirect(`${origin}/auth/github-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`);
  }

  const scope = "repo,read:user,user:email";
  const redirectUri = `${origin}/auth/github-callback`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope });
  if (userId) params.set("state", userId);

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
