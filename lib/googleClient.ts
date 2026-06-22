import { google } from "googleapis";
import { createAdminClient } from "@insforge/sdk";

function adminClient() {
  return createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
}

export async function getOAuth2ClientForUser(userId: string) {
  const admin = adminClient();
  const { data } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", "google_drive").maybeSingle();
  const state = data?.state || {};

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/google-callback` : (process.env.GOOGLE_REDIRECT_URI || "");

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const tokens: any = {};
  if (state.refresh_token) tokens.refresh_token = state.refresh_token;
  if (state.access_token) tokens.access_token = state.access_token;
  if (state.expires_at) tokens.expiry_date = new Date(state.expires_at).getTime();
  if (Object.keys(tokens).length) oAuth2Client.setCredentials(tokens);

  // Persist any tokens obtained via refresh or initial exchange
  oAuth2Client.on("tokens", async (tokens) => {
    try {
      const updated = { ...(state || {}) };
      if (tokens.refresh_token) updated.refresh_token = tokens.refresh_token;
      if (tokens.access_token) updated.access_token = tokens.access_token;
      if (tokens.expiry_date) updated.expires_at = new Date(tokens.expiry_date).toISOString();
      await admin.database.from("integrations").update({ state: updated, updated_at: new Date().toISOString(), connected: true }).eq("user_id", userId).eq("platform", "google_drive");
    } catch (e) {
      console.warn("Failed to persist refreshed Google tokens", e);
    }
  });

  return oAuth2Client;
}

export async function getDriveClientForUser(userId: string) {
  const auth = await getOAuth2ClientForUser(userId);
  return google.drive({ version: "v3", auth });
}

export default getDriveClientForUser;
