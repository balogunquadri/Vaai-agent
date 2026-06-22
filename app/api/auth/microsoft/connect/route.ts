import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams;
  const userId = search.get("userId") || "unknown";
  const scopes = search.get("scopes") || "User.Read%20offline_access%20Chat.ReadWrite%20ChannelMessage.Send%20Team.ReadBasic.All";
  const pkce = search.get("pkce") !== "false"; // default true

  const clientId = process.env.MS_CLIENT_ID || process.env.NEXT_PUBLIC_MS_CLIENT_ID;
  const redirect = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/microsoft-callback` : (process.env.MS_REDIRECT_URI || "");
  const tenant = process.env.MS_TENANT_ID || "common";

  if (!clientId || !redirect) {
    return NextResponse.json({ error: "Microsoft OAuth not configured" }, { status: 400 });
  }

  let code_challenge = undefined;
  if (pkce) {
    const code_verifier = crypto.randomBytes(32).toString("base64url");
    const hash = crypto.createHash("sha256").update(code_verifier).digest();
    code_challenge = Buffer.from(hash).toString("base64url");
    const res = NextResponse.redirect(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&response_mode=query&scope=${scopes}&state=${encodeURIComponent(userId)}&code_challenge=${encodeURIComponent(code_challenge)}&code_challenge_method=S256`
    );
    // store code_verifier in cookie for callback to use
    res.cookies.set({ name: "microsoft_pkce", value: code_verifier, httpOnly: true, path: "/", maxAge: 300 });
    return res;
  }

  return NextResponse.redirect(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&response_mode=query&scope=${scopes}&state=${encodeURIComponent(userId)}`
  );
}
