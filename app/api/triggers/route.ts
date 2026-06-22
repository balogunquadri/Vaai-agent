import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data, error } = await admin.database.from('triggers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message || "db error" }, { status: 500 });
    return NextResponse.json({ ok: true, triggers: data || [] });
  } catch (err: any) {
    console.error('triggers GET error', err);
    return NextResponse.json({ error: err.message || 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, spec } = body;
    if (!userId || !name || !spec) return NextResponse.json({ error: 'userId, name, spec required' }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data, error } = await admin.database.from('triggers').insert([
      { user_id: userId, name, spec }
    ]).select().single();
    if (error) return NextResponse.json({ error: error.message || 'db insert error' }, { status: 500 });
    return NextResponse.json({ ok: true, trigger: data });
  } catch (err: any) {
    console.error('triggers POST error', err);
    return NextResponse.json({ error: err.message || 'internal' }, { status: 500 });
  }
}
