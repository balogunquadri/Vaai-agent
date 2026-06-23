import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { createEmailToken } from "@/lib/email/tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email;
    const name = body.name || "";
    if (!email) return NextResponse.json({ error: "missing_email" }, { status: 400 });

    const token = createEmailToken(email, "reset", 60 * 30); // 30 minutes
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_APP_DOMAIN || "example.com"}`;
    const resetUrl = `${appUrl}/auth/reset?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family: system-ui, Arial, sans-serif; color: #0f172a">
        <h2>Hi${name ? `, ${name}` : ""}!</h2>
        <p>We received a request to reset your password — click the link below to continue:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `;

    const resp = await sendEmail(email, "Reset your V-AI password", html);
    return NextResponse.json({ ok: true, resp });
  } catch (err: any) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
