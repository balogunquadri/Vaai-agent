import { NextResponse } from "next/server";
import { verifyEmailToken } from "../../../../lib/email/tokens";
import { createAdminClient } from "@insforge/sdk";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

    const payload = verifyEmailToken(token, "reset");
    if (!payload) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });

    // At this point you can render a reset form in the frontend (link contains token)
    return NextResponse.json({ ok: true, email: payload.email });
  } catch (err: any) {
    console.error("reset token error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token;
    const newPassword = body.password;
    if (!token || !newPassword) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

    const payload = verifyEmailToken(token, "reset");
    if (!payload) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
    // Hash the new password and update users table in InsForge (best-effort)
    try {
      const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
      const salt = bcrypt.genSaltSync(10);
      const hashed = bcrypt.hashSync(newPassword, salt);

      const { data: existingUser, error: fetchErr } = await admin.database.from("users").select().eq("email", payload.email).maybeSingle();
      if (fetchErr) throw fetchErr;

      if (existingUser) {
        const { error: updateErr } = await admin.database.from("users").update({ password_hash: hashed, updated_at: new Date().toISOString() }).eq("email", payload.email);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await admin.database.from("users").insert([{ email: payload.email, password_hash: hashed, created_at: new Date().toISOString() }]);
        if (insertErr) throw insertErr;
      }
    } catch (dbErr) {
      console.error("Failed to update password in DB:", dbErr);
      return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email: payload.email });
  } catch (err: any) {
    console.error("reset POST error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
