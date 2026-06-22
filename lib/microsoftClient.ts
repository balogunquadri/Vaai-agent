import { createAdminClient } from "@insforge/sdk";

function adminClient() {
  return createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
}

const TOKEN_URL = (tenant = "common") => `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function persistTokens(userId: string, platform: string, state: any) {
  const admin = adminClient();
  try {
    await admin.database.from("integrations").update({ state, connected: true, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", platform);
  } catch (e) {
    console.warn("Failed to persist MS tokens", e);
  }
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string | null, redirectUri: string, tenant = "common") {
  const params: any = {
    client_id: process.env.MS_CLIENT_ID || process.env.NEXT_PUBLIC_MS_CLIENT_ID || "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  };
  if (process.env.MS_CLIENT_SECRET) params.client_secret = process.env.MS_CLIENT_SECRET;
  if (codeVerifier) params.code_verifier = codeVerifier;

  const body = new URLSearchParams(params);
  const res = await fetch(TOKEN_URL(tenant), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error_description || data?.error || "Token exchange failed");
  return data;
}

export async function refreshAccessToken(refreshToken: string, tenant = "common") {
  const params: any = {
    client_id: process.env.MS_CLIENT_ID || process.env.NEXT_PUBLIC_MS_CLIENT_ID || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };
  if (process.env.MS_CLIENT_SECRET) params.client_secret = process.env.MS_CLIENT_SECRET;
  const body = new URLSearchParams(params);
  const res = await fetch(TOKEN_URL(tenant), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error_description || data?.error || "Refresh token failed");
  return data;
}

export async function getGraphClientForUser(userId: string) {
  const admin = adminClient();
  const { data } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "microsoft_teams").maybeSingle();
  const state = data?.state || {};
  let accessToken = state?.access_token || null;
  let refreshToken = state?.refresh_token || null;
  let expiresAt = state?.expires_at ? new Date(state.expires_at).getTime() : 0;

  async function ensureValidToken() {
    const now = Date.now();
    if (accessToken && expiresAt && now < expiresAt - 60000) return accessToken; // still valid with 60s buffer
    if (refreshToken) {
      try {
        const tokens = await refreshAccessToken(refreshToken);
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token || refreshToken;
        expiresAt = tokens.expires_in ? Date.now() + Number(tokens.expires_in) * 1000 : Date.now() + 55 * 60 * 1000;
        const newState = { ...state, access_token: accessToken, refresh_token: refreshToken, expires_at: new Date(expiresAt).toISOString() };
        await persistTokens(userId, "microsoft_teams", newState);
        return accessToken;
      } catch (err) {
        console.warn("Failed to refresh MS token", err);
        throw err;
      }
    }
    throw new Error("No valid access or refresh token available for Microsoft Graph");
  }

  async function graphFetch(path: string, opts: any = {}) {
    const token = await ensureValidToken();
    const headers = opts.headers || {};
    headers.Authorization = `Bearer ${token}`;
    if (opts.json) headers["Content-Type"] = "application/json";
    const res = await fetch(`${GRAPH_BASE}${path}`, { ...opts, headers });
    const text = await res.text().catch(() => "");
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
    if (!res.ok) throw new Error(parsed?.error?.message || parsed || `Graph fetch failed: ${res.status}`);
    return parsed || {};
  }

  return { graphFetch, rawState: state };
}

export async function revokeMsTokens(userId: string) {
  try {
    const admin = adminClient();
    const { data } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "microsoft_teams").maybeSingle();
    const state = data?.state || {};
    const accessToken = state?.access_token;
    if (accessToken) {
      try {
        // Try to revoke sessions via Graph
        await fetch(`${GRAPH_BASE}/me/revokeSignInSessions`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      } catch (e) {
        console.warn("Failed to call revokeSignInSessions", e);
      }
    }
    await admin.database.from("integrations").update({ connected: false, state: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "microsoft_teams");
  } catch (e) { console.warn("Failed to clear MS integration row", e); }
}

export default getGraphClientForUser;
