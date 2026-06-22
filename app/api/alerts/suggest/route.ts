import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });

  try {
    // naive suggestion: look at recent integrations activity and propose simple alerts
    const { data: recent, error } = await insforge.database.from('integrations').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(8);
    if (error) console.error(error);

    const suggestions = (recent || []).slice(0,6).map((r:any)=>({
      title: `High activity in ${r.platform}`,
      summary: `Recent events from ${r.platform} suggest monitoring for spikes or mentions.`,
      platform: r.platform,
      priority: 'medium',
      condition: `${r.platform}:activity > 10`
    }));

    return NextResponse.json({ success: true, suggestions });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
