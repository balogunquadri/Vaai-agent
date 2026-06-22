import { NextResponse } from 'next/server';
import { createAdminClient } from '@insforge/sdk';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: user } = await admin.database.from('users').select('id,activation_expires').eq('activation_token', token).maybeSingle();
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

    if (user.activation_expires && new Date(user.activation_expires) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    await admin.database.from('users').update({ activated: true, activation_token: null, activation_expires: null, updated_at: new Date().toISOString() }).eq('id', user.id);

    const origin = process.env.SITE_URL || 'http://localhost:3000';
    const html = `<!doctype html><html><body><script>window.location.href='${origin}/sign-in?activated=1'</script></body></html>`;
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('activate error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
