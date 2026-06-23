import { createAdminClient } from "@insforge/sdk";

const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

const LARK_AUTHORIZE = "https://open.larksuite.com/connect/authorize";
const LARK_TOKEN = "https://open.larksuite.com/connect/v1/oauth2/token";
const LARK_REVOKE = "https://open.larksuite.com/connect/v1/oauth2/revoke";

export async function exchangeCodeForTokens(code: string, redirectUri: string, pkceVerifier?: string) {
  const clientId = process.env.LARK_CLIENT_ID;
  const clientSecret = process.env.LARK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Simulated tokens for local development
    return {
      access_token: `SIMULATED_LARK_ACCESS_${code}`,
      refresh_token: `SIMULATED_LARK_REFRESH_${code}`,
      expires_in: 3600,
      scope: "profile email",
    } as any;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  if (pkceVerifier) body.append("code_verifier", pkceVerifier);

  const res = await fetch(LARK_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Lark token exchange failed: " + JSON.stringify(data));
  return data;
}

export async function revokeToken(token: string) {
  const clientId = process.env.LARK_CLIENT_ID;
  const clientSecret = process.env.LARK_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  try {
    const res = await fetch(LARK_REVOKE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to revoke Lark token", err);
    return false;
  }
}

export async function persistLarkTokensForUser(userId: string, tokens: any) {
  const toSave: any = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    expires_at: tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : null,
    raw: tokens,
  };

  await admin.database.from("integrations").upsert([
    { user_id: userId, platform: "lark", connected: true, state: toSave }
  ], { onConflict: "user_id,platform" });
}

export async function clearLarkIntegration(userId: string) {
  try {
    await admin.database.from("integrations").delete().eq("user_id", userId).eq("platform", "lark");
  } catch (err) {
    console.error("Failed to clear lark integration", err);
  }
}

export default {
  exchangeCodeForTokens,
  revokeToken,
  persistLarkTokensForUser,
  clearLarkIntegration,
};
