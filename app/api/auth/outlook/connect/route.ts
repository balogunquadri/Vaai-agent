import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";

  // If client id isn't configured, simulate OAuth flow for local/dev
  if (!clientId) {
    const redirectUrl = `${origin}/auth/outlook-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`;
    return NextResponse.redirect(redirectUrl);
  }

  const authorizeBase = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;
  const redirectUri = `${origin}/auth/outlook-callback`;
  const scope = [
    "openid",
    "profile",
    "offline_access",
    "User.Read",
    "Mail.Read",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "Contacts.Read",
  ].join(" ");

  const params: Record<string, string> = {
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope,
    state: userId,
    prompt: "consent",
  };

  const url = `${authorizeBase}?${new URLSearchParams(params).toString()}`;
  return NextResponse.redirect(url);
}
