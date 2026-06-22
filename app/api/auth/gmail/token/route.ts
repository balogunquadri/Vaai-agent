import { NextResponse } from "next/server";
import { getValidGmailToken } from "@/lib/gmail";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const token = await getValidGmailToken(userId);

    if (!token) {
      const admin = createAdminClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
        apiKey: process.env.INSFORGE_API_KEY!,
      });
      const { data: row } = await admin.database
        .from("integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", "gmail")
        .maybeSingle();

      return NextResponse.json({ 
        error: "Gmail account not connected or unauthorized",
        debug: {
          hasRow: !!row,
          connected: row?.connected,
          hasState: !!row?.state,
          hasAccessToken: !!row?.state?.access_token,
          hasRefreshToken: !!row?.state?.refresh_token,
          expiresAt: row?.state?.expires_at,
          currentTime: Date.now()
        }
      }, { status: 401 });
    }

    return NextResponse.json({ success: true, accessToken: token });
  } catch (error: any) {
    console.error("GET /api/auth/gmail/token failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
