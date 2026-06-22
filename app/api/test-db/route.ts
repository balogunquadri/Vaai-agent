import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET() {
  try {
    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const tables = ['users', 'integrations', 'briefings', 'schedules', 'briefing_schedules', 'briefings_list'];
    const results: any = {};
    for (const table of tables) {
      const { data, error } = await admin.database
        .from(table)
        .select('*')
        .limit(1);
      if (error) {
        results[table] = { exists: false, error: error.message };
      } else {
        results[table] = { exists: true, data };
      }
    }
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
