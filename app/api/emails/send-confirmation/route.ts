import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { createEmailToken } from "@/lib/email/tokens";
import { createAdminClient } from "@insforge/sdk";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let body: any = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (err) {
        console.error("send-confirmation invalid JSON", text);
        return NextResponse.json({ error: "invalid_json", raw: text }, { status: 400 });
      }
    }

    const email = body.email;
    const name = body.name || "";

    if (!email) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    // create a short-lived confirmation token and link
    const token = createEmailToken(email, "confirm", 60 * 60 * 24);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_APP_DOMAIN || "example.com"}`;
    const confirmUrl = `${appUrl}/api/auth/confirm?token=${encodeURIComponent(token)}`;

    // Insert/update user with confirmed: false in the public users table using the admin client
    try {
      const admin = createAdminClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
        apiKey: process.env.INSFORGE_API_KEY!,
      });
      const { data: existingUser } = await admin.database
        .from("users")
        .select()
        .eq("email", email)
        .maybeSingle();

      if (!existingUser) {
        await admin.database.from("users").insert([
          {
            email,
            name: name || null,
            confirmed: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        await admin.database
          .from("users")
          .update({ name: name || existingUser.name })
          .eq("email", email);
      }
    } catch (dbErr) {
      console.error("Failed to insert initial user row:", dbErr);
    }

    const html = `
      <div style="font-family: system-ui, Arial, sans-serif; color: #0f172a">
        <h2>Welcome${name ? `, ${name}` : ""}!</h2>
        <p>Click the link below to confirm your email and activate your account:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>If you didn't request this, ignore this email.</p>
        <p>— The V-AI Team</p>
      </div>
    `;

    const from = process.env.FROM_EMAIL || `onboarding@${process.env.NEXT_PUBLIC_APP_DOMAIN || "example.com"}`;

    const resp = await sendEmail(email, "Confirm your V-AI account", html);
    return NextResponse.json({ ok: true, resp });
  } catch (err: any) {
    console.error("send-confirmation error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
