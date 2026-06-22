import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { getAppRecentItems } from "@/lib/mcpApps";

export async function POST(request: Request) {
  try {
    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    // Fetch active triggers
    const { data: triggers, error: tErr } = await admin.database.from('triggers').select('*').eq('active', true).limit(200);
    if (tErr) {
      console.error('Failed to load triggers', tErr);
      return NextResponse.json({ success: false, error: tErr.message }, { status: 500 });
    }

    const results: any[] = [];

    for (const trig of triggers || []) {
      try {
        const userId = trig.user_id;
        const spec = trig.spec || {};
        const platforms = spec.platforms && Array.isArray(spec.platforms) && spec.platforms.length>0 ? spec.platforms : (spec.platform ? [spec.platform] : []);
        const condition = spec.condition || '';

        let matched = false;
        let matchedPlatform = null;

        for (const platform of platforms) {
          // fetch recent items from MCP feed
          const items = await getAppRecentItems(userId, platform, 50);

          // simple condition parsing: 'activity > N'
          const actMatch = condition.match(/activity\s*>\s*(\d+)/i);
          if (actMatch) {
            const threshold = parseInt(actMatch[1], 10);
            if ((items?.length || 0) > threshold) {
              matched = true; matchedPlatform = platform; break;
            }
          }

          // simple contains: platform:contains("word") or contains 'word'
          const containsMatch = condition.match(/contains\(["'](.+?)["']\)/i) || condition.match(/contains\s+["'](.+?)["']/i);
          if (containsMatch) {
            const needle = containsMatch[1].toLowerCase();
            if (items.some((it:any)=> (it.title||'').toLowerCase().includes(needle) || (it.text||'').toLowerCase().includes(needle))) {
              matched = true; matchedPlatform = platform; break;
            }
          }

          // default heuristic: if items include 'error' or 'urgent' mark as matched
          if (items.some((it:any)=> ((it.title||'')+" "+(it.text||'')).toLowerCase().match(/urgent|error|failed|incident/))) {
            matched = true; matchedPlatform = platform; break;
          }
        }

        if (matched) {
          const now = new Date().toISOString();
          const alertRow = {
            user_id: trig.user_id,
            title: `Triggered: ${trig.name}`,
            description: `Trigger '${trig.name}' matched on platform ${matchedPlatform || 'unknown'}`,
            platform: matchedPlatform,
            priority: spec.priority || 'high',
            status: 'active',
            created_at: now,
            triggered_at: now
          };

          const { data: inserted, error: insErr } = await admin.database.from('alerts').insert(alertRow).select();
          if (insErr) console.error('Failed to insert alert', insErr);

          // update trigger last_run
          await admin.database.from('triggers').update({ last_run: now, last_matched_at: now }).eq('id', trig.id);

          results.push({ trigger: trig.id, matched: true, alert: inserted?.[0] || null });
        } else {
          // update last_run only
          await admin.database.from('triggers').update({ last_run: new Date().toISOString() }).eq('id', trig.id);
          results.push({ trigger: trig.id, matched: false });
        }
      } catch (inner) {
        console.error('Error evaluating trigger', trig.id, inner);
        results.push({ trigger: trig.id, error: String(inner) });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e:any) {
    console.error('evaluate-triggers error', e);
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
  }
}
