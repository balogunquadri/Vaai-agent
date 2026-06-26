import type { Adapter } from "./adapter";
import { getSimulatedFeed } from "@/lib/simulatedFeeds";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  const token = userState?.xBearer || process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) return getSimulatedFeed("x").slice(0, limit);

  try {
    const res = await fetch(`https://api.twitter.com/2/users/me/tweets?max_results=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data?.data) return data.data.map((t: any) => ({ id: t.id, title: t.text.slice(0, 80), text: t.text, time: t.created_at }));
  } catch (err) {
    console.warn("X adapter getRecentItems failed:", err);
  }
  return getSimulatedFeed("x").slice(0, limit);
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  const token = userState?.xBearer || process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) return { ok: true, note: "simulated" };

  if (toolName === "x_post_tweet" || toolName === "twitter_post_tweet") {
    const text = args.text || args.status || args.tweet;
    if (!text) throw new Error("Missing text");
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (res.ok) return data;
    throw new Error(data?.title || "Failed to post tweet");
  }

  throw new Error(`X adapter: unknown tool ${toolName}`);
}

async function getToolSchemas(userId: string) {
  return [
    {
      name: "x_post_tweet",
      description: "Publish a status message update/tweet directly onto the user's Twitter/X timeline.",
      parameters: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "Tweet content message." }
        },
        required: ["text"]
      }
    }
  ];
}

const xAdapter: Adapter = { getRecentItems, executeTool, getToolSchemas };
export default xAdapter;

