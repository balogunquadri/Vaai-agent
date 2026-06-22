import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Simulate OAuth when server config is missing
    const kind = searchParams.get("kind") || "";
    const stateSim = kind ? `${userId}|${kind}` : `${userId}`;
    return NextResponse.redirect(`${origin}/auth/google-callback?code=SIMULATED_CODE&state=${encodeURIComponent(stateSim)}`);
  }

  const redirectUri = `${origin}/auth/google-callback`;
  const kind = searchParams.get("kind") || "";
  // Default scopes. Adjust scopes based on requested kind and optional access param.
  const baseScopes = ["openid", "email", "profile"];
  let extraScopes: string[] = ["https://www.googleapis.com/auth/calendar.events.readonly", "https://www.googleapis.com/auth/drive.readonly"];

  // Allow an explicit access level for Drive via ?access=readonly|file|full
  const access = searchParams.get("access") || "readonly";
  if (kind === "drive") {
    if (access === "readonly") extraScopes = ["https://www.googleapis.com/auth/drive.readonly"];
    else if (access === "file") extraScopes = ["https://www.googleapis.com/auth/drive.file"];
    else extraScopes = ["https://www.googleapis.com/auth/drive"];
  } else if (kind === "meet") {
    // calendar.events gives ability to create/update events; include Meet-specific or broader calendar scope
    extraScopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/meetings.space.created",
    ];
  }

  const scope = [...baseScopes, ...extraScopes].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    scope,
  });
  // Encode both userId and optional kind into the state so the callback can know this is a Meet connection
  if (userId) {
    const st = kind ? `${userId}|${kind}` : userId;
    params.set("state", st);
  }

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
