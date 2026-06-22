import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Server OAuth configuration is missing" },
      { status: 500 }
    );
  }

  try {
    // Exchange authorization code for tokens
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/auth/gmail-callback`,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      return NextResponse.json(
        { error: "Failed to exchange authorization code", details: data },
        { status: response.status }
      );
    }

    // Save access token securely in integrations table in database if userId exists
    if (userId) {
      try {
        const admin = createAdminClient({
          baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
          apiKey: process.env.INSFORGE_API_KEY!,
        });

        const { data: existing } = await admin.database
          .from("integrations")
          .select("id, state")
          .eq("user_id", userId)
          .eq("platform", "gmail")
          .maybeSingle();

        const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        const stateToSave: any = {
          access_token: data.access_token,
          expires_at: expiresAt,
        };

        if (data.refresh_token) {
          stateToSave.refresh_token = data.refresh_token;
        } else if (existing?.state?.refresh_token) {
          stateToSave.refresh_token = existing.state.refresh_token;
        }

        if (existing) {
          await admin.database
            .from("integrations")
            .update({
              connected: true,
              state: stateToSave,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await admin.database.from("integrations").insert([
            {
              user_id: userId,
              platform: "gmail",
              connected: true,
              state: stateToSave,
            },
          ]);
        }
      } catch (dbErr) {
        console.error("Failed to save Gmail token to integrations DB:", dbErr);
      }
    }

    // Return HTML page that saves the access token in localStorage and redirects back to integrations dashboard
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Callback</title>
        </head>
        <body style="background: #030014; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <div style="border: 4px solid #8b5cf6; border-top-color: transparent; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 16px auto; animation: spin 1s linear infinite;"></div>
            <p style="font-size: 14px; font-weight: 500;">Completing Gmail connection...</p>
          </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <script>
            try {
              localStorage.setItem('gmail_access_token', '${data.access_token}');
              localStorage.setItem('gmail_connected', 'true');
              window.location.href = '${origin}/dashboard/integrations?connected=gmail';
            } catch (e) {
              console.error(e);
              alert("Failed to save credentials.");
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Internal server error during OAuth exchange", details: error.message },
      { status: 500 }
    );
  }
}
