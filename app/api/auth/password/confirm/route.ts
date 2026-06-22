import { NextResponse } from 'next/server';
import { createAdminClient } from '@insforge/sdk';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) return NextResponse.json({ error: 'token and newPassword required' }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: user } = await admin.database.from('users').select('id,reset_token_expires').eq('reset_token', token).maybeSingle();
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

    if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(newPassword, salt, 64).toString('hex');

    await admin.database.from('users').update({ password_hash: hash, password_salt: salt, reset_token: null, reset_token_expires: null, updated_at: new Date().toISOString() }).eq('id', user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('password confirm error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
