import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email/tokens";
import { createAdminClient } from "@insforge/sdk";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

    const payload = verifyEmailToken(token, "confirm");
    if (!payload) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });

    // Mark user as confirmed in the InsForge `users` table (best-effort)
    try {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

      const { data: existingUser, error: fetchErr } = await admin.database.from("users").select().eq("email", payload.email).maybeSingle();
      if (fetchErr) throw fetchErr;

      if (existingUser) {
        const { error: updateErr } = await admin.database.from("users").update({ confirmed: true, updated_at: new Date().toISOString() }).eq("email", payload.email);
        if (updateErr) throw updateErr;
      } else {
        // Insert a minimal user row if none exists (no id available)
        const { error: insertErr } = await admin.database.from("users").insert([{ email: payload.email, confirmed: true, created_at: new Date().toISOString() }]);
        if (insertErr) throw insertErr;
      }
    } catch (dbErr) {
      console.error("Failed to mark user confirmed:", dbErr);
      // Don't fail the flow — return success but note that DB update failed
      return NextResponse.json({ ok: true, email: payload.email, db: "error" });
    }

    return NextResponse.json({ ok: true, email: payload.email });
  } catch (err: any) {
    console.error("confirm token error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
