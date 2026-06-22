import { createAdminClient } from "@insforge/sdk";
import { getAdapter } from "./mcpRegistry";

// Normalize incoming platform items into a simple event shape
export function normalizeItem(platformId: string, item: any) {
  return {
    platform: platformId,
    id: item.id || item.pageId || item.fileId || `${platformId}:${Math.random().toString(36).slice(2,9)}`,
    title: item.title || item.summary || item.name || item.repo || "Untitled",
    text: item.text || item.snippet || item.description || "",
    user: item.user || item.from || item.author || item.repo || null,
    time: item.time || item.updated_at || item.last_edited_time || new Date().toISOString(),
    raw: item,
  };
}

export async function syncUserIntegrations(userId: string) {
  const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

  // Fetch connected integrations for the user
  const { data: integrations } = await admin.database.from("integrations").select("platform, state").eq("user_id", userId).eq("connected", true);
  if (!integrations || integrations.length === 0) return { synced: 0 };

  let inserted = 0;

  for (const row of integrations) {
    const platform = row.platform.replace(/^custom_connected_/, "");
    const adapter = getAdapter(platform);
    try {
      let items: any[] = [];
      if (adapter?.getRecentItems) {
        items = await adapter.getRecentItems(userId, 10, row.state || {});
      } else {
        // Fallback: call existing endpoint via server-side helper in lib/mcpApps
        // To avoid circular imports, fetch via internal API
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/mcp/feed?userId=${encodeURIComponent(userId)}&platformId=${encodeURIComponent(platform)}`);
        if (res.ok) items = await res.json().then(r => r.items || []);
      }

      for (const it of items) {
        const ev = normalizeItem(platform, it);
        // Insert into briefings_list table as a lightweight event feed
        try {
          await admin.database.from("briefings_list").insert([{ user_id: userId, platform: ev.platform, item_id: ev.id, title: ev.title, body: ev.text, metadata: ev.raw, created_at: ev.time }]);
          inserted++;
        } catch (dbErr) {
          console.warn("Failed to insert briefing list item:", dbErr);
        }
      }
    } catch (err) {
      console.warn(`Failed to sync platform ${platform}:`, err);
    }
  }

  return { synced: inserted };
}

export default { normalizeItem, syncUserIntegrations };
