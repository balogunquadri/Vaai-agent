import type { Adapter } from "./adapter";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  const token = userState?.notionToken || process.env.NOTION_API_KEY;
  if (!token) return [];

  try {
    const res = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: limit })
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.results)) return [];
    return data.results.slice(0, limit).map((p: any) => ({
      id: p.id,
      title: (p.properties?.title?.title?.[0]?.plain_text) || p.object || "Notion Page",
      text: `Notion object: ${p.object}`,
      pageId: p.id,
      time: p.last_edited_time || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("Notion adapter getRecentItems failed:", err);
    return [];
  }
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  const token = userState?.notionToken || process.env.NOTION_API_KEY;
  if (!token) throw new Error("Notion token missing for adapter");

  if (toolName === "notion_get_page") {
    const pageId = args.pageId || args.id || userState?.pageId;
    if (!pageId) throw new Error("Missing parameter: pageId");
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" }
    });
    if (!res.ok) throw new Error(`Notion get page failed: ${res.statusText}`);
    return await res.json();
  }

  if (toolName === "notion_append_block") {
    const pageId = args.pageId || userState?.pageId;
    const blocks = args.blocks || [];
    if (!pageId) throw new Error("Missing parameter: pageId");
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ children: blocks })
    });
    if (!res.ok) throw new Error(`Notion append block failed: ${res.statusText}`);
    return await res.json();
  }

  throw new Error(`Notion adapter: tool ${toolName} not implemented`);
}

const notionAdapter: Adapter = {
  getRecentItems,
  executeTool,
};

export default notionAdapter;
