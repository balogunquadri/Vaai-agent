import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;
  const clientId = process.env.ZOOM_CLIENT_ID;
  if (!clientId) {
    const kind = searchParams.get("kind") || "";
    const stateSim = kind ? `${userId}|${kind}` : `${userId}`;
    return NextResponse.redirect(`${origin}/auth/zoom-callback?code=SIMULATED_CODE&state=${encodeURIComponent(stateSim)}`);
  }

  const redirectUri = `${origin}/auth/zoom-callback`;

  // Support PKCE for public clients by generating a code_challenge and embedding the verifier into state
  const usePkce = searchParams.get("pkce") === "1";
  let pkceVerifier: string | undefined = undefined;
  let codeChallengeParams: Record<string, string> = {};
  if (usePkce) {
    const crypto = await import("crypto");
    pkceVerifier = crypto.randomBytes(48).toString("base64url");
    const hash = crypto.createHash("sha256").update(pkceVerifier).digest();
    const challenge = Buffer.from(hash).toString("base64url");
    codeChallengeParams = { code_challenge: challenge, code_challenge_method: "S256" };
  }

  const params = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri });
  if (userId) {
    const kind = searchParams.get("kind") || "";
    let stateVal = kind ? `${userId}|${kind}` : `${userId}`;
    if (usePkce && pkceVerifier && codeChallengeParams.code_challenge) {
      // include the same verifier in state so callback can use it for token exchange
      stateVal = `${stateVal}|pkce|${pkceVerifier}`;
      params.set("code_challenge", codeChallengeParams.code_challenge!);
      params.set("code_challenge_method", codeChallengeParams.code_challenge_method!);
    }
    params.set("state", stateVal);
  }

  return NextResponse.redirect(`https://zoom.us/oauth/authorize?${params.toString()}`);
}
