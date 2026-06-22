import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import tokenManager from "@/lib/tokenManager";

// Protect this endpoint with a shared secret header: X-JOBS-SECRET
const JOBS_SECRET = process.env.JOBS_SECRET || "";

export async function POST(request: Request) {
  try {
    const headerSecret = request.headers.get("x-jobs-secret") || "";
    if (JOBS_SECRET && headerSecret !== JOBS_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    // Fetch integrations that may have refresh-able tokens
    const { data: rows, error } = await admin.database.from("integrations").select("user_id, platform, state").not("state", "is", null);
    if (error) {
      console.error("refresh-tokens: failed to read integrations", error);
      return NextResponse.json({ error: "failed to read integrations" }, { status: 500 });
    }

    const results: any[] = [];
    for (const row of rows || []) {
      try {
        const userId = row.user_id;
        const platform = row.platform;
        const newState = await tokenManager.refreshAndSaveIntegration(userId, platform);
        results.push({ userId, platform, refreshed: !!newState });
      } catch (err) {
        console.error("refresh-tokens: error refreshing", row.platform, row.user_id, err);
        results.push({ userId: row.user_id, platform: row.platform, refreshed: false, error: String(err) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err) {
    console.error("/api/jobs/refresh-tokens error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
