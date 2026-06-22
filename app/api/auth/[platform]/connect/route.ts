import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request, { params }: { params: { platform: string } }) {
  const { platform } = params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  const envClientKey = `${platform.toUpperCase().replace(/-/g, "_")}_CLIENT_ID`;
  const clientId = process.env[envClientKey as keyof NodeJS.ProcessEnv];

  // If client id isn't set, simulate an OAuth flow by redirecting to callback with a fake code
  if (!clientId) {
    const redirectUrl = `${origin}/auth/${platform}-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Basic provider authorize URL guesses for common platforms
  const providerAuthorizeMap: Record<string, string> = {
    github: "https://github.com/login/oauth/authorize",
    google: "https://accounts.google.com/o/oauth2/v2/auth",
    google_calendar: "https://accounts.google.com/o/oauth2/v2/auth",
    google_drive: "https://accounts.google.com/o/oauth2/v2/auth",
    zoom: "https://zoom.us/oauth/authorize",
    slack: "https://slack.com/oauth/v2/authorize",
    notion: "https://www.notion.com/oauth2/authorize",
    microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    outlook: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
  };

  const authorizeBase = providerAuthorizeMap[platform] || providerAuthorizeMap[platform.split("_")[0]] || providerAuthorizeMap[platform.replace(/-/g, "_")];

  if (!authorizeBase) {
    // Unknown provider with client id; still simulate
    const redirectUrl = `${origin}/auth/${platform}-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Build a conservative redirect URL — providers may require additional scope/query params per-platform
  const redirectUri = `${origin}/auth/${platform}-callback`;
  const paramsObj: Record<string, string> = { client_id: clientId, redirect_uri: redirectUri, state: userId };

  // Add some common scopes for known providers
  if (platform === "github") paramsObj.scope = "repo,read:user";
  if (platform.startsWith("google")) paramsObj.scope = "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.events.readonly";
  if (platform === "slack") paramsObj.scope = "channels:read,channels:history,chat:write,groups:read,im:read,mpim:read";

  const search = new URLSearchParams(paramsObj).toString();
  return NextResponse.redirect(`${authorizeBase}?${search}`);
}
