import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";
import crypto from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const pkce = searchParams.get("pkce");
  const scopes = searchParams.get("scopes") || "tweet.read tweet.write users.read offline.access";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID;
  if (clientId) {
    // Use OAuth2 authorization code flow redirect (assumes server-side callback handler exists)
    const redirectUri = `${origin}/auth/x-callback`;
    const scope = encodeURIComponent(scopes);

    // If PKCE requested, generate verifier & challenge and store verifier in httpOnly cookie
    if (pkce) {
      const code_verifier = crypto.randomBytes(64).toString("base64url");
      const hash = crypto.createHash("sha256").update(code_verifier).digest();
      const code_challenge = Buffer.from(hash).toString("base64url");
      const twitterUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(userId)}&code_challenge=${encodeURIComponent(code_challenge)}&code_challenge_method=S256`;
      const res = NextResponse.redirect(twitterUrl);
      res.headers.append("Set-Cookie", `x_pkce=${encodeURIComponent(code_verifier)}; Path=/; HttpOnly; SameSite=Lax`);
      return res;
    }

    const twitterUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(userId)}&code_challenge=challenge&code_challenge_method=plain`;

    return NextResponse.redirect(twitterUrl);
  }

  // Simulate connect when no client configured
  try {
    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "x")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await insforge.database.from("integrations").insert([
        { user_id: userId, platform: "x", connected: true }
      ]);
    }
  } catch (err) {
    console.error("X connect simulation failed:", err);
  }

  return NextResponse.redirect(`${origin}/dashboard/integrations?connected=x`);
}
