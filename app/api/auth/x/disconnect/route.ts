import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";
import { deriveUserIdFromRequest } from "@/lib/authHelpers";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const derived = deriveUserIdFromRequest(request) || body.userId || "";
    if (!derived) return NextResponse.json({ error: "missing userId" }, { status: 400 });

    const userId = derived;
    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "x")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: false, state: null, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("X disconnect error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
