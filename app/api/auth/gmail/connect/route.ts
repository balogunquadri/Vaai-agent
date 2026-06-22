import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured on the server." },
      { status: 500 }
    );
  }

  // Redirect to Google OAuth authorization page, passing userId as state
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    `${origin}/auth/gmail-callback`
  )}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent${
    userId ? `&state=${encodeURIComponent(userId)}` : ""
  }`;

  return NextResponse.redirect(googleOAuthUrl);
}
