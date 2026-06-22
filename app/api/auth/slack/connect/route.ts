import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "SLACK_CLIENT_ID is not configured on the server." }, { status: 500 });
  }

  const scopes = [
    "channels:read",
    "channels:history",
    "chat:write",
    "groups:read",
    "im:read",
    "mpim:read"
  ].join(",");

  const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(
    clientId
  )}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(`${origin}/auth/slack-callback`)}${
    userId ? `&state=${encodeURIComponent(userId)}` : ""
  }`;

  return NextResponse.redirect(slackUrl);
}
