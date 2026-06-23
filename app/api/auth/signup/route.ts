import { NextResponse } from 'next/server';
import { createAdminClient } from '@insforge/sdk';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/resend';
import { activationEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    // check existing
    const { data: existing } = await admin.database.from('users').select('id,email').eq('email', email).maybeSingle();
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    const activationToken = crypto.randomBytes(24).toString('hex');
    const activationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h

    const insert = {
      email,
      name: name || null,
      password_hash: hash,
      password_salt: salt,
      activated: false,
      activation_token: activationToken,
      activation_expires: activationExpires,
      created_at: new Date().toISOString(),
    } as any;

    await admin.database.from('users').insert([insert]);

    // send activation email
    const origin = process.env.SITE_URL || `http://localhost:3000`;
    const url = `${origin}/api/auth/activate?token=${activationToken}`;
    await sendEmail(email, 'Activate your account', activationEmail(name || email, url));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('signup error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
