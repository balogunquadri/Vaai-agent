import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: row } = await admin.database.from("integrations").select("*").eq("user_id", userId).eq("platform", "zoom").maybeSingle();

    if (!row || !row.state || !row.state.access_token) {
      return NextResponse.json({ error: "Zoom account not connected", debug: { hasRow: !!row, connected: row?.connected, hasState: !!row?.state } }, { status: 401 });
    }

    return NextResponse.json({ success: true, accessToken: row.state.access_token });
  } catch (err: any) {
    console.error("GET /api/auth/zoom/token failed:", err);
    return NextResponse.json({ error: err.message || "internal" }, { status: 500 });
  }
}
