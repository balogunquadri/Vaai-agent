import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest, context: { params: Promise<any> }) {
  const params = context && context.params ? await context.params : ({} as any);
  const alertId = params?.id;
  if (!alertId) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const now = new Date().toISOString();
    const { data, error } = await insforge.database.from('alerts').update({ status: 'resolved', resolved_at: now }).eq('id', alertId).select();
    if (error) {
      console.error(error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert: data?.[0] || null });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
