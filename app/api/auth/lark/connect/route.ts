import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const scopes = searchParams.get("scopes") || "profile email";
  const pkce = searchParams.get("pkce");

  const clientId = process.env.LARK_CLIENT_ID;
  const redirect = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/lark-callback` : (process.env.LARK_REDIRECT_URI || "");

  if (!clientId) {
    // Simulate auth flow in dev
    const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;
    return NextResponse.redirect(`${origin}/auth/lark-callback?code=SIMULATED_CODE&state=${encodeURIComponent(userId)}`);
  }

  let url = new URL("https://open.larksuite.com/connect/authorize");
  url.searchParams.set("app_id", clientId);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", userId);

  if (pkce) {
    // generate code_verifier and code_challenge
    const code_verifier = randomBytes(32).toString("base64url");
    const sha = createHash("sha256").update(code_verifier).digest();
    const code_challenge = Buffer.from(sha).toString("base64url");
    url.searchParams.set("code_challenge", code_challenge);
    url.searchParams.set("code_challenge_method", "S256");
    // set cookie with verifier
    const res = NextResponse.redirect(url.toString());
    res.headers.append("Set-Cookie", `lark_pkce=${encodeURIComponent(code_verifier)}; Path=/; HttpOnly; SameSite=Lax`);
    return res;
  }

  return NextResponse.redirect(url.toString());
}
