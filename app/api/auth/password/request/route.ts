import { NextResponse } from 'next/server';
import { createAdminClient } from '@insforge/sdk';
import crypto from 'crypto';
import { sendEmail } from '../../../../../lib/email/resend';
import { resetPasswordEmail } from '../../../../../lib/email/templates';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: user } = await admin.database.from('users').select('id,name').eq('email', email).maybeSingle();
    if (!user) return NextResponse.json({ ok: true }); // don't reveal existence

    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    await admin.database.from('users').update({ reset_token: token, reset_token_expires: expires, updated_at: new Date().toISOString() }).eq('id', user.id);

    const origin = process.env.SITE_URL || 'http://localhost:3000';
    const url = `${origin}/auth/password-confirm?token=${token}`;
    await sendEmail(email, 'Reset your password', resetPasswordEmail(user.name || email, url));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('password request error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
