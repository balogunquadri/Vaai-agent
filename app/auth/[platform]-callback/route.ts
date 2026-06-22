import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request, { params }: { params: { platform: string } }) {
  const { platform } = params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state") || "";
  const origin = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  // For now we won't exchange code with provider; we simulate or store the code as a token placeholder.
  const tokenToSave = code ? `simulated:${code}` : `simulated:no-code`;

  if (userId) {
    try {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

      const { data: existing } = await admin.database
        .from("integrations")
        .select("id, state")
        .eq("user_id", userId)
        .eq("platform", platform)
        .maybeSingle();

      const stateToSave: any = {
        access_token: tokenToSave,
        platform,
        received_at: new Date().toISOString()
      };

      if (existing) {
        await admin.database.from("integrations").update({ connected: true, state: stateToSave, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([{ user_id: userId, platform, connected: true, state: stateToSave }]);
      }
    } catch (dbErr) {
      console.error(`Failed to save ${platform} token to integrations DB:`, dbErr);
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${platform} Authentication</title>
      </head>
      <body style="background: #030014; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <div style="border: 4px solid #8b5cf6; border-top-color: transparent; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 16px auto; animation: spin 1s linear infinite;"></div>
          <p style="font-size: 14px; font-weight: 500;">Completing ${platform} connection...</p>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>
          try {
            localStorage.setItem('${platform}_connected', 'true');
            window.location.href = '${origin}/dashboard/integrations?connected=${encodeURIComponent(platform)}';
          } catch (e) {
            console.error(e);
            alert('Failed to finalize connection.');
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(htmlContent, { headers: { "Content-Type": "text/html" } });
}
