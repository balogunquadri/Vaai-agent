import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || "";

    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "jira")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: false, state: {}, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Jira disconnect failed:", err);
    return NextResponse.json({ success: false, error: "disconnect_failed" }, { status: 500 });
  }
}
