import { createAdminClient } from "@insforge/sdk";

/**
 * Retrieves a valid, unexpired Gmail access token.
 * If the current token is close to expiry or expired, and a refresh token is available,
 * it performs a refresh flow and updates the database.
 */
export async function getValidGmailToken(userId: string): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const admin = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    apiKey: process.env.INSFORGE_API_KEY!,
  });

  const { data: row, error } = await admin.database
    .from("integrations")
    .select("id, state, connected")
    .eq("user_id", userId)
    .eq("platform", "gmail")
    .maybeSingle();

  if (error) {
    console.error("Error fetching Gmail integration for refresh:", error);
    return null;
  }

  if (!row || !row.connected || !row.state) {
    return null;
  }

  let state = row.state;
  if (typeof state === "string") {
    try {
      state = JSON.parse(state);
    } catch (e) {
      console.error("Failed to parse Gmail state string from DB:", e);
      return null;
    }
  }

  const { access_token, refresh_token, expires_at } = state;

  // Check if token is still valid. Give it a 2-minute buffer.
  const isExpired = expires_at ? (Date.now() >= expires_at - 120 * 1000) : true;

  if (access_token && !isExpired) {
    return access_token;
  }

  // If there's no refresh token, we can't refresh. Return access_token as fallback, or null if expired
  if (!refresh_token) {
    console.warn("No refresh token stored for Gmail integration. Cannot refresh.");
    // If we have an access token and were not explicitly marked expired, return it and hope for the best
    if (access_token && !expires_at) {
      return access_token;
    }
    return null;
  }

  // Perform refresh flow
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET on the server.");
      return access_token || null;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      console.error("Google OAuth token refresh failed:", data);
      
      // If the refresh token is revoked/invalid, mark integration disconnected
      if (response.status === 400 || response.status === 410 || data.error === "invalid_grant") {
        await admin.database
          .from("integrations")
          .update({
            connected: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }
      return null;
    }

    // Google may return a new refresh token or omit it. Keep original if not returned.
    const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    const updatedState = {
      ...state,
      access_token: data.access_token,
      expires_at: newExpiresAt,
    };
    if (data.refresh_token) {
      updatedState.refresh_token = data.refresh_token;
    }

    await admin.database
      .from("integrations")
      .update({
        state: updatedState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return data.access_token;
  } catch (err) {
    console.error("Failed to refresh Gmail OAuth token:", err);
    return access_token || null;
  }
}

/**
 * Recursively scans message payload to extract plain text body.
 */
export function extractEmailBody(part: any): string {
  if (!part) return "";
  if (part.body?.data && part.mimeType === "text/plain") {
    try {
      const base64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (e) {
      console.error("Failed to decode base64 email body:", e);
      return "";
    }
  }
  if (part.parts && part.parts.length > 0) {
    for (const subpart of part.parts) {
      const body = extractEmailBody(subpart);
      if (body) return body;
    }
  }
  return "";
}

/**
 * Recursively scans message payload to extract HTML fallback body.
 */
export function extractHtmlFallback(part: any): string {
  if (!part) return "";
  if (part.body?.data && part.mimeType === "text/html") {
    try {
      const base64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
      const html = Buffer.from(base64, 'base64').toString('utf-8');
      // Simple HTML stripping
      return html.replace(/<[^>]*>/g, ' ');
    } catch (e) {
      console.error("Failed to decode base64 email html fallback:", e);
      return "";
    }
  }
  if (part.parts && part.parts.length > 0) {
    for (const subpart of part.parts) {
      const body = extractHtmlFallback(subpart);
      if (body) return body;
    }
  }
  return "";
}
