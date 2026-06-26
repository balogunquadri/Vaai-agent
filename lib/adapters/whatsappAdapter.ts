import type { Adapter } from "./adapter";
import { whatsappManager } from "@/lib/whatsapp";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  try {
    // Return cached chats via manager
    const status = whatsappManager.getStatus(userId);
    if (status.state !== "connected") return [];
    const result = await whatsappManager.executeMcp(userId, "whatsapp_get_recent_messages", { limit });
    return Array.isArray(result) ? result.slice(0, limit) : [];
  } catch (err) {
    console.error("whatsappAdapter getRecentItems error:", err);
    return [];
  }
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  try {
    return await whatsappManager.executeMcp(userId, toolName, args || {});
  } catch (err) {
    console.error("whatsappAdapter executeTool error:", err);
    throw err;
  }
}

async function getToolSchemas(userId: string) {
  return [
    {
      name: "whatsapp_get_recent_messages",
      description: "Fetch the latest messages from all recent WhatsApp chats.",
      parameters: {
        type: "OBJECT",
        properties: {
          limit: { type: "INTEGER", description: "Optional limit of chats to fetch (defaults to 5)." }
        }
      }
    },
    {
      name: "whatsapp_read_chat_history",
      description: "Retrieve the full chat message history/logs for a specific WhatsApp JID/chatId.",
      parameters: {
        type: "OBJECT",
        properties: {
          chatId: { type: "STRING", description: "The WhatsApp chatId or JID (e.g. '12345@s.whatsapp.net')." }
        },
        required: ["chatId"]
      }
    },
    {
      name: "whatsapp_send_message",
      description: "Send a text message directly to a WhatsApp phone number or JID.",
      parameters: {
        type: "OBJECT",
        properties: {
          to: { type: "STRING", description: "The recipient's phone number or WhatsApp JID." },
          message: { type: "STRING", description: "Text content to transmit." }
        },
        required: ["to", "message"]
      }
    },
    {
      name: "whatsapp_search_chats",
      description: "Find a contact or chatId in WhatsApp matching a query string.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING", description: "Search term like contact name or phone number." }
        },
        required: ["query"]
      }
    }
  ];
}

const whatsappAdapter: Adapter = { getRecentItems, executeTool, getToolSchemas };

export default whatsappAdapter;
