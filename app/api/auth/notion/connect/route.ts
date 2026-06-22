import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "NOTION_CLIENT_ID is not configured on the server." }, { status: 500 });
  }

  const scopes = ["pages:read", "databases:read"].join(" ");
  const notionUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
    `${origin}/auth/notion-callback`
  )}${userId ? `&state=${encodeURIComponent(userId)}` : ""}&scope=${encodeURIComponent(scopes)}`;

  return NextResponse.redirect(notionUrl);
}
