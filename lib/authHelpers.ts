export async function refreshToken(platform: string, state: any): Promise<any> {
  try {
    if (!state || !state.refresh_token) return state;
    const refreshToken = state.refresh_token;

    switch (platform) {
      case "google":
      case "google_calendar":
      case "google_drive": {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }).toString(),
        });
        if (!res.ok) throw new Error("Google refresh failed");
        const data = await res.json();
        return {
          ...state,
          access_token: data.access_token,
          refresh_token: data.refresh_token || state.refresh_token,
          expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
        };
      }

      case "notion": {
        const res = await fetch("https://api.notion.com/v1/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: process.env.NOTION_CLIENT_ID,
            client_secret: process.env.NOTION_CLIENT_SECRET,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return { ...state, access_token: data.access_token, refresh_token: data.refresh_token || state.refresh_token };
        }
        return state;
      }

      case "microsoft":
      case "outlook": {
        const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID || process.env.OUTLOOK_CLIENT_ID || "",
            client_secret: process.env.MICROSOFT_CLIENT_SECRET || process.env.OUTLOOK_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }).toString(),
        });
        if (res.ok) {
          const data = await res.json();
          return {
            ...state,
            access_token: data.access_token,
            refresh_token: data.refresh_token || state.refresh_token,
            expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
          };
        }
        return state;
      }

      case "zoom": {
        const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID || ""}:${process.env.ZOOM_CLIENT_SECRET || ""}`).toString("base64");
        const res = await fetch("https://zoom.us/oauth/token", {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
        });
        if (res.ok) {
          const data = await res.json();
          return {
            ...state,
            access_token: data.access_token,
            refresh_token: data.refresh_token || state.refresh_token,
            expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
          };
        }
        return state;
      }

      // Providers that typically don't expose refresh or use long-lived tokens — return original state
      case "github":
      case "slack":
      case "telegram":
      default:
        return state;
    }
  } catch (err) {
    console.error("refreshToken error for", platform, err);
    return state;
  }
}

export default { refreshToken };

// Derive a user identifier from a server request.
// Looks for `x-user-id` / `x-userid` headers, `Authorization: Bearer <id>`, or a `userId` cookie.
export function deriveUserIdFromRequest(req: any): string | null {
  try {
    if (!req) return null;
    const headers = req.headers;
    // NextRequest/Request-like headers
    const getHeader = (name: string) => {
      if (!headers) return undefined;
      if (typeof headers.get === "function") return headers.get(name);
      return headers[name.toLowerCase()];
    };

    const h1 = getHeader("x-user-id") || getHeader("x-userid");
    if (h1) return String(h1);

    const auth = getHeader("authorization");
    if (auth && typeof auth === "string") {
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m) return m[1];
    }

    const cookieHeader = getHeader("cookie");
    if (cookieHeader && typeof cookieHeader === "string") {
      const match = cookieHeader.match(/(?:^|;)\s*userId=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }

    // NextRequest.cookies() support (server runtime)
    try {
      if (typeof req.cookies === "function") {
        const c = req.cookies();
        const maybe = c.get && c.get("userId");
        if (maybe && maybe.value) return String(maybe.value);
      }
    } catch (e) {
      /* ignore */
    }

    return null;
  } catch (e) {
    return null;
  }
}
