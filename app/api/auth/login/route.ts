import { NextResponse } from 'next/server';
import { createAdminClient } from '@insforge/sdk';
import crypto from 'crypto';

function signToken(payload: Record<string, any>) {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: user } = await admin.database.from('users').select('id,email,password_hash,password_salt,activated').eq('email', email).maybeSingle();
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    if (!user.activated) return NextResponse.json({ error: 'Account not activated' }, { status: 401 });

    const hash = crypto.scryptSync(password, user.password_salt, 64).toString('hex');
    if (hash !== user.password_hash) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({ userId: user.id, email: user.email, iat: Date.now() });
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    console.error('login error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
