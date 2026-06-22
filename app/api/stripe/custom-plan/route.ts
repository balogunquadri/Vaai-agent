import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let body: any = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        console.error("custom-plan: invalid JSON body:", text);
        return NextResponse.json({ error: "invalid_json", raw: text }, { status: 400 });
      }
    }

    const email = body.email || "";
    const name = body.name || "";
    const message = body.message || "";

    const to = process.env.CUSTOM_PLAN_EMAIL || "yes201045@gmail.com";

    // If SMTP env is provided, attempt to send email
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || smtpUser || "no-reply@example.com";

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("SMTP not configured — skipping actual send, logging request instead.");
      console.log(`Custom plan requested by ${name} <${email}>: ${message}`);
      return NextResponse.json({ ok: true, note: "smtp_not_configured" });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject: "custom plan",
      text: `Custom plan requested by ${name} <${email}>. Message:\n\n${message}`,
      html: `<p>Custom plan requested by <strong>${name}</strong> &lt;${email}&gt;.</p><p><strong>Message:</strong></p><p>${(message || "").replace(/\n/g, "<br />")}</p>`,
    });

    return NextResponse.json({ ok: true, info });
  } catch (err: any) {
    console.error("custom-plan error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
