import type { Adapter } from "./adapter";
import { decrypt } from "../crypto";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  const token = decrypt(userState?.slackToken) || process.env.SLACK_BOT_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`https://slack.com/api/conversations.list?limit=${limit}&types=public_channel,private_channel`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.channels)) {
      return data.channels.slice(0, limit).map((c: any) => ({
        id: c.id,
        title: `#${c.name}`,
        text: c.topic?.value || c.purpose?.value || "Slack channel",
        user: "Slack",
        time: new Date().toISOString()
      }));
    }
  } catch (err) {
    console.warn("Slack adapter getRecentItems failed:", err);
  }
  return [];
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  const token = decrypt(userState?.slackToken) || process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("Slack token missing for adapter");

  if (toolName === "slack_list_channels") {
    const res = await fetch("https://slack.com/api/conversations.list", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.ok) return data.channels;
    throw new Error(data.error || "Slack API error");
  }

  if (toolName === "slack_post_message") {
    const channel = args.channel || args.channelId || userState?.defaultChannel || "general";
    const text = args.text || args.message;
    if (!text) throw new Error("Missing parameter: text");
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel, text })
    });
    const data = await res.json();
    if (data.ok) return { success: true, ts: data.ts, message: text, channel };
    throw new Error(data.error || "Failed to post Slack message");
  }

  throw new Error(`Slack adapter: tool ${toolName} not implemented`);
}

async function getToolSchemas(userId: string) {
  return [
    {
      name: "slack_list_channels",
      description: "List all active Slack workspace channels available for alerts.",
      parameters: {
        type: "OBJECT",
        properties: {}
      }
    },
    {
      name: "slack_post_message",
      description: "Post a message or alert to a specific Slack channel.",
      parameters: {
        type: "OBJECT",
        properties: {
          channel: { type: "STRING", description: "Channel name (e.g. 'dev-ops', 'general')." },
          text: { type: "STRING", description: "Message text content." }
        },
        required: ["channel", "text"]
      }
    }
  ];
}

const slackAdapter: Adapter = {
  getRecentItems,
  executeTool,
  getToolSchemas
};

export default slackAdapter;
